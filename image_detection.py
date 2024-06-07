import base64
import json
import boto3
import cv2
import numpy as np
import os
import time
from boto3.dynamodb.conditions import Key

# initialize AWS resources
sns = boto3.resource('sns')
topic = sns.Topic('arn:aws:sns:us-east-1:891377373548:ImageDetect')
s3_resource = boto3.resource('s3')
dynamodb = boto3.resource('dynamodb')

# parameters
confthres = 0.3
nmsthres = 0.1
yolo_path = '/tmp/yolo-coco'
os.makedirs(yolo_path, exist_ok=True)

# YOLO model
labelsPath = "coco.names"
cfgpath = "yolov3-tiny.cfg"
wpath = "yolov3-tiny.weights"

thumb_bucket = 'fit5225-thumb'


# download images from first s3
def s3_download_images(s3_bucket, s3_key, target_path):
    try:
        s3_resource.Bucket(s3_bucket).download_file(s3_key, target_path)
        print(f'Downloaded file to {target_path}')
    except Exception as e:
        print(f"Error in download images: {e}")


# convert images to thumbnails
def convert_thumbnails(image_path, max_size=128):
    """Resize the image to the specified maximum size while maintaining aspect ratio."""
    try:
        img = cv2.imread(image_path, cv2.IMREAD_UNCHANGED)
        if img is None:
            raise ValueError(f"Failed to load image from path: {image_path}")

        h, w = img.shape[:2]
        scale = max_size / max(h, w)
        new_size = (int(w * scale), int(h * scale))
        img_resized = cv2.resize(img, new_size, interpolation=cv2.INTER_LINEAR)
        return img_resized
    except Exception as e:
        print(f"Error in converting thumbnails: {e}")
        return None


# upload images to s3
def upload_to_s3(bucket, key, upload_path):
    try:
        s3_resource.Bucket(bucket).upload_file(upload_path, key)
        print(f'Uploaded file to {bucket}/{key}')
    except Exception as e:
        print(f"Error uploading file to S3: {e}")


# upload images info(id,url,tag) to dynnamoDB
def store_to_dynamodb(key, bucket, thumb_bucket, labels):
    table = dynamodb.Table('fit5225')
    for label in labels:
        try:
            response = table.put_item(
                Item={
                    'id': f'{key}_{label}',
                    'image_url': f"https://{bucket}.s3.amazonaws.com/{key}",
                    'thumbnail_url': f"https://{thumb_bucket}.s3.amazonaws.com/{key}",
                    'tag': label
                }
            )
            print(f'save resonses = {response}')
            response = topic.publish(
                Message=f'images tags: {label}',
                Subject='detection',
                MessageAttributes={
                    'tag': {
                        'DataType': 'String',
                        'StringValue': f'{label}'
                    }
                }
            )
            print(f'topic response = {response}')
        except Exception as e:
            print(f"Error storing image info to DynamoDB: {e}")


# download yolo model, detect images
def detection_image(task_id, image_file):
    YOLO_files_bucket = 'yolo-5225'
    s3_download_images(YOLO_files_bucket, labelsPath, os.path.join(yolo_path, labelsPath))
    s3_download_images(YOLO_files_bucket, cfgpath, os.path.join(yolo_path, cfgpath))
    s3_download_images(YOLO_files_bucket, wpath, os.path.join(yolo_path, wpath))
    labels = get_labels(labelsPath)
    cfg = get_config(cfgpath)
    weights = get_weights(wpath)
    try:
        img = cv2.imread(image_file)
        npimg = np.array(img)
        image = npimg.copy()
        image = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
        net = load_model(cfg, weights)
        objects = do_prediction(image, net, labels)
        return objects
    except Exception as e:
        print(f"error in detect images: {e}")
        return None


# handle upload new image to first s3 bucket
# download original images,convert to thumbnails and upload to second s3, amd upload info to DB
def s3_new_image(event, context):
    bucket = event['Records'][0]['s3']['bucket']['name']
    key = event['Records'][0]['s3']['object']['key']

    # download images from first s3 bucket
    download_path = f'/tmp/{os.path.basename(key)}'
    upload_path = f'/tmp/resized-{os.path.basename(key)}'
    s3_download_images(bucket, key, download_path)

    # convert original images to thumbnails
    image_resized = convert_thumbnails(download_path)
    cv2.imwrite(upload_path, image_resized,
                [int(cv2.IMWRITE_JPEG_QUALITY), 90])

    # upload thumbnails to second s3 bucket
    upload_to_s3(thumb_bucket, key, upload_path)

    # detect images
    task_id = os.path.splitext(key)[0]
    objects = detection_image(task_id, download_path)
    if objects is None:
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'error'
            })
        }

    # extract labels
    labels = [object['label'] for object in objects]
    store_to_dynamodb(key, bucket, thumb_bucket, labels)

    return {}

#api calling, images decoded, images detection
def calling_api(event, context):
    try:
        print("get image in base64")
        base64_image = json.loads(event['body'])['file']
        base64_image = base64_image.split(",")[-1]

        # base64 images decoded
        image_data = base64.b64decode(base64_image)
        image_np_array = np.frombuffer(image_data, dtype=np.uint8)
        image = cv2.imdecode(image_np_array, cv2.IMREAD_COLOR)

        # Save image
        cv2.imwrite('/tmp/image.jpg', image)

        # images detection
        objects = detection_image(0, '/tmp/image.jpg')
        labels = [obj['label'] for obj in objects]

        # query db by tags
        table = dynamodb.Table('fit5225')
        results_set = []
        print(labels)
        for tag in labels:
            response = table.query(
                IndexName='tag-index',  # Ensure you have created a GSI on 'tag'
                KeyConditionExpression=Key('tag').eq(tag)
            )
            if 'Items' in response:
                print(response['Items'])
                urls = set([item['thumbnail_url'] for item in response['Items']])
                results_set.append(urls)
        print(results_set)

        # get query output
        if results_set:
            result = set.intersection(*results_set)
        else:
            result = []

        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*',
            },
            "body": json.dumps({"links": list(result)})
        }
    except Exception as e:
        print("Error occurred")
        print(e)
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Headers': '*',
                'Access-Control-Allow-Methods': '*',
            }
        }


#load coco label
def get_labels(labels_path):
    lpath = os.path.sep.join([yolo_path, labels_path])
    LABELS = open(lpath).read().strip().split("\n")
    return LABELS

#get yolo weights path
def get_weights(weights_path):
    weightsPath = os.path.sep.join([yolo_path, weights_path])
    return weightsPath

#get yolo config path
def get_config(config_path):
    configPath = os.path.sep.join([yolo_path, config_path])
    return configPath

#load model
def load_model(configpath, weightspath):
    print(f"load YOLO, configpath = {configpath}, weightspath = {weightspath}")
    net = cv2.dnn.readNetFromDarknet(configpath, weightspath)
    return net

#images detect by yolo
def do_prediction(image, net, LABELS):
    (H, W) = image.shape[:2]
    ln = net.getLayerNames()
    ln = [ln[i - 1] for i in net.getUnconnectedOutLayers()]

    blob = cv2.dnn.blobFromImage(image, 1 / 255.0, (416, 416), swapRB=True, crop=False)
    net.setInput(blob)
    start = time.time()
    layerOutputs = net.forward(ln)
    end = time.time()
    print("[INFO] YOLO took {:.6f} seconds".format(end - start))

    boxes = []
    confidences = []
    classIDs = []

    for output in layerOutputs:
        for detection in output:
            scores = detection[5:]
            classID = np.argmax(scores)
            confidence = scores[classID]
            if confidence > confthres:
                box = detection[0:4] * np.array([W, H, W, H])
                (centerX, centerY, width, height) = box.astype("int")
                x = int(centerX - (width / 2))
                y = int(centerY - (height / 2))
                boxes.append([x, y, int(width), int(height)])

                confidences.append(float(confidence))
                classIDs.append(classID)

    idxs = cv2.dnn.NMSBoxes(boxes, confidences, confthres,
                            nmsthres)

    objects = []
    if len(idxs) > 0:
        for i in idxs.flatten():
            json_obj = {}
            json_obj['label'] = LABELS[classIDs[i]]
            json_obj['accuracy'] = confidences[i]
            json_obj['rectangle'] = {'height': boxes[i][3], 'width': boxes[i][2], 'left': boxes[i][0],
                                     'top': boxes[i][1]}
            objects.append(json_obj)
    return objects


def lambda_handler(event, context):
    print(f'event = {event}')
    if 'Records' in event:
        return s3_new_image(event, context)
    elif 'httpMethod' in event:
        return calling_api(event, context)
    else:
        raise Exception('Invalid handler')