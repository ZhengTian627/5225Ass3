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
            setMessage('No pictures to upload');
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
            setMessage('Picture uploaded successfully');
            setAlertType("success");
            console.log('Picture uploaded successfully', data);
        } catch (error) {
            setMessage('An error occurred while uploading images');
            setAlertType("error");
            console.log('An error occurred while uploading images:', error);
        }

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
                <button className="search-button" onClick={handleSubmit}>Upload</button>
                </div>
                {message && <Alert severity={alertType}>{message}</Alert>}
            </div>
        </div>
)
    ;
}

export default ImageUpload;

