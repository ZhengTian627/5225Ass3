import React, { useState } from 'react';
import { s3 } from "./AwsConfig";
import axios from "axios";

function ImageComponent() {
    const [imageUrls, setImageUrls] = useState([]);
    const [thumbUrl, setThumbUrl] = useState([]);
    const [tags, setTags] = useState([]);
    const thumbnailBucket = 'fit5225-thumb';  // Thumbnail bucket
    const originalBucket = 'fit5225ass3';  // Please replace this with the bucket of the original image
    const [fileName, setFileName] = useState('No file chosen');

    const getSignedUrl = (bucket, key) => {
        return s3.getSignedUrl('getObject', {
            Bucket: bucket,
            Key: key,
            Expires: 3600 // Link is valid for 1 hour
        });
    }

    // change the URL of image
    const switchImageUrl = (index, originalUrl) => {
        const updatedUrls = [...imageUrls];
        updatedUrls[index] = originalUrl;
        setImageUrls(updatedUrls);
    }

    const submitThumbUrl = async () => {
        const urlParts = thumbUrl.split('/');
        const key = urlParts.slice(3).join('/'); // Get key
        setImageUrls([...imageUrls, getSignedUrl(originalBucket, key)]);
    }

    const submitTags = async () => {
        try {
            const apiPath = 'https://pwwdakok1g.execute-api.us-east-1.amazonaws.com/dev/search';
            const response = await fetch(apiPath, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'authorization': 'Bearer ' + localStorage.getItem('access_token')
                },

                body: JSON.stringify({tags: tags.split(',').map(tag => tag.trim())})
            });

            if (!response.ok) {
                throw new Error(response.statusText);
            }

            const data = await response.json();
            const signedImageUrls = data.links.map(link => {
                const urlParts = link.split('/');
                const key = urlParts.slice(3).join('/'); // Get key
                console.info(key)
                return getSignedUrl(thumbnailBucket, key);  // Get the signature URL of the thumbnail
            });
            setImageUrls(signedImageUrls);
        } catch (error) {
            console.error('Error:', error);
        }
    };

    const [selectedFile, setSelectedFile] = useState(null);

    // Input element to select the file after the handler
    const handleDetectFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        const file = e.target.files[0];
        if (file) {
            setFileName(file.name);
        } else {
            setFileName('No file chosen');
        }
    };

    const handleButtonClick = () => {
        document.getElementById('fileInput').click();
    };

    // Submit the form and upload the file
    const handleFileUpload = async (e) => {
        e.preventDefault();

        if (!selectedFile) {
            alert("Please select a file first!");
            return;
        }
        console.log(selectedFile);
        const reader = new FileReader();
        reader.readAsDataURL(selectedFile);
        reader.onload = async function () {
            try {
                const response = await axios.post(
                    "https://pwwdakok1g.execute-api.us-east-1.amazonaws.com/dev/detect",
                    { file: reader.result },
                    {
                        headers: {
                            "Content-Type": "application/json",
                            'authorization': 'Bearer ' + localStorage.getItem('access_token')
                        },
                    }
                );
                console.info(response.data);
                if (response.data.links.length > 0) {
                    const signedImageUrls = response.data.links.map(link => {
                        const urlParts = link.split('/');
                        const key = urlParts.slice(3).join('/'); // Get key
                        return getSignedUrl(thumbnailBucket, key);  // Get the signature URL of the thumbnail
                    });
                    setImageUrls(signedImageUrls);
                    setSelectedFile(null);
                } else {
                    alert("No picture same like this");
                }
            } catch (e) {
                console.error("Wrong", e);
            }
        };
        reader.onerror = function (error) {
            console.error('Error: ', error);
        };
    };

    const handleDeleteClick = async (url) => {
        console.log(url);
        try {
            const response = await axios.post(
                "https://pwwdakok1g.execute-api.us-east-1.amazonaws.com/dev/delete",
                { "url": url },
                {
                    headers: {
                        "Content-Type": "application/json",
                        'authorization': 'Bearer ' + localStorage.getItem('access_token')
                    },
                }
            );
            console.info(response.data);
            alert(response.data);
            const urlParts = url.split('/');
            const key = urlParts.slice(3).join('/'); // Get key
            setImageUrls(imageUrls.filter(url => !url.includes(key)));
        } catch (e) {
            console.error("something wrong", e);
        }
    }

    return (
        <div>
            <span>Search Here</span>
            <div className='App-content'>
            <div>
                <input className="text-button" type="text" value={thumbUrl} onChange={e => setThumbUrl(e.target.value)}
                       placeholder="Enter thumbnail’s url"/>
                <button className="search-button" onClick={submitThumbUrl}>Search by  thumbnail’s url</button>
            </div>
            <div>
                <input className="text-button" type="text" value={tags} onChange={e => setTags(e.target.value)}
                       placeholder="Enter tags"/>
                <button className="search-button" onClick={submitTags}>Search by tags</button>
            </div>
            
            <div>
                {/* <input
                    type="file"
                    accept="image/*"
                    onChange={handleDetectFileChange}
                /> */}

                <input
                type="file"
                id="fileInput"
                accept="image/*"
                onChange={handleDetectFileChange}
                style={{ display: 'none' }}
                />
                <button className="custom-upload-button" onClick={handleButtonClick}>
                    Choose Image
                </button>
                <span>{fileName}</span>
                <button className="search-button" onClick={handleFileUpload}>Find picture with same tag</button>
            </div>
        </div>
        <div>
                {
                    imageUrls.map((imageUrl, index) =>
                        <div key={index}>
                            <img src={imageUrl} alt={"Thumbnail" + index} onClick={() => {
                                const urlParts = imageUrl.split('/');
                                const key_with_sign = urlParts.slice(3).join('/')
                                const key = key_with_sign.split('?').slice(0)[0]; // Get key
                                const originalUrl = getSignedUrl(originalBucket, key);
                                switchImageUrl(index, originalUrl);
                            }
                            }/>
                            <button onClick={(e) => handleDeleteClick(imageUrl)}>Delete Image</button>
                        </div>)
                }
            </div>
        </div>
        
    );
}

export default ImageComponent;