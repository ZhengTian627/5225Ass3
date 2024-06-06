import React, { useState } from 'react';
import axios from "axios";

function InputForm() {

    const [tags, setTags] = useState([]);
    const [links, setLinks] = useState([]);
    const [type, setType] = useState("1");

    const handleAddLinksFields = () => {
        setLinks([...links, '']);
    }

    const handleRemoveLinksFields = (index) => {
        const values  = [...links];
        values.splice(index, 1);
        setLinks(values);
    }

    const handleLinksChange = (index, event) => {
        const values = [...links];
        values[index] = event.target.value;
        setLinks(values);
    }

    const handleAddTagFields = () => {
        setTags([...tags, '']);
    }

    const handleRemoveTagFields = (index) => {
        const values  = [...tags];
        values.splice(index, 1);
        setTags(values);
    }

    const handleTagChange = (index, event) => {
        const values = [...tags];
        values[index] = event.target.value;
        setTags(values);
    }

    const handleTypeChange = (event) => {
        setType(event.target.value);
    }

    const handleSubmit = async (event) => {
        event.preventDefault();
        const data = {
            "url": links,
            "tags": tags,
            "type":type
        };
        try {
            const response = await axios.post("https://d1czgpd2jd.execute-api.us-east-1.amazonaws.com/dev/change", data,
                {
                    headers: {
                        "Content-Type": "application/json",
                        'authorization': 'Bearer ' + localStorage.getItem('access_token')
                    },
                });
            console.log(response);
            alert(response.data);
        } catch (err) {
            console.error(err);
        }
    };


    return (
        <div>
            <div>
                Select tag action
                <select className="search-button" name="type" value={type} onChange={event => handleTypeChange(event)}>
                    <option value="1">add tag</option>
                    <option value="0">remove tag</option>
                </select>
            </div>
            <div>
                {tags.map((tag, index) => (
                    <div key={index}>
                        <input type="text" placeholder="Enter tag" name="tag" value={tag}
                               onChange={event => handleTagChange(index, event)}/>
                        <button type="button" onClick={() => handleRemoveTagFields(index)}>delete column</button>
                    </div>
                ))}
                <button className="search-button" type="button" onClick={() => handleAddTagFields()}>add tag colum</button>
            </div>
            <div>
                {links.map((link, index) => (
                    <div key={index}>
                        <input type="text" placeholder="Enter thumbnail’s url" name="link" value={link}
                               onChange={event => handleLinksChange(index, event)}/>
                        <button type="button" onClick={() => handleRemoveLinksFields(index)}>delete column</button>
                    </div>
                ))}
                <button className="search-button" type="button" onClick={() => handleAddLinksFields()}>add url colum</button>
            </div>

            <button className="search-button" onClick={handleSubmit}>Submit tag change</button>
        </div>
    );
}

export default InputForm;