import React from 'react';
import './App.css'
import { sns } from './AwsConfig'





function SNSPage() {
    const [tags, setTags] = React.useState('');

    const submitSubscribe =  () => {
        const jsonPolicy = JSON.stringify({tag: tags.split(',').map(tag => tag.trim())})
        sns.subscribe({ // SubscribeInput
            TopicArn: "arn:aws:sns:us-east-1:891377373548:ImageDetect", // required
            Protocol: "email", // required
            Endpoint: localStorage.getItem('email'),
            Attributes: { // SubscriptionAttributesMap
                "FilterPolicy": jsonPolicy,
            }
        }, (err, data) => {
            console.info(err)
            console.info(data)
            alert("Please confirm subscription when you receive confirm email!");
        })
    };

    return (
        <div className='App-content'>
            <div>
                <input className="text-button" type="text" value={tags} onChange={e => setTags(e.target.value)}
                       placeholder="Enter the tag you want to subscribe, separated by commas"/>
                <button className="search-button" onClick={submitSubscribe}>subscribe</button>
            </div>
        </div>
    )
        ;
}

export default SNSPage;

