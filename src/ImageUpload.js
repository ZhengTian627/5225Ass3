import React, { useState } from 'react';
import Alert from '@mui/material/Alert';
import {apigClient, s3} from './AwsConfig'
import axios from "axios";

function ImageUpload() {
    const [image, setImage] = useState(null);
    const [message, setMessage] = useState("");
    const [alertType, setAlertType] = useState("success");
    const [fileName, setFileName] = useState('No file chosen');

    const handleFileChange = (event) => {
        setImage(event.target.files[0]);
        const file = event.target.files[0];
        if (file) {
            setFileName(file.name);
        } else {
            setFileName('No file chosen');
        }
    }

    const handleButtonClick = () => {
        document.getElementById('imageUpload').click();
    };

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!image) {
            setMessage('没有图片进行上传');
            setAlertType("info");
            return;
        }

        const user_id = localStorage.getItem('user_id');

        const fileName = `${user_id}/${image.name}`;
        const uploadParams = {
            Bucket: 'fit5225ass3',
            Key: fileName,
            Body: image
        };

        try {
            const data = await s3.upload(uploadParams).promise();
            setMessage('图片上传成功');
            setAlertType("success");
            console.log('图片上传成功', data);
        } catch (error) {
            setMessage('上传图片时发生错误');
            setAlertType("error");
            console.log('上传图片时发生错误:', error);
        }

        // try {
        //     console.log('取消上传，参数:', uploadParams);
        //     const data = await s3.upload(uploadParams).promise();
        //     setMessage('图片上传成功');
        //     setAlertType("success");
        //     console.log('图片上传成功', data);
        // } catch (error) {
        //     setMessage('图片上传失败错误');
        //     setAlertType("error");
        //     console.log('图片上传失败错误:', error);
        // }
    }



    return (
        <div >
            <span>Upload Here</span>
            <div>
                <div >
                <input
                    type="file"
                    id="imageUpload"
                    accept="image/*"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    />
                    <button className="custom-upload-button" onClick={handleButtonClick}>
                        Choose Image
                    </button>
                    <div><span>{fileName}</span></div>
                <button className="search-button" onClick={handleSubmit}>Find picture with same tag</button>
                </div>
                {message && <Alert severity={alertType}>{message}</Alert>}
            </div>
        </div>
)
    ;
}

export default ImageUpload;

