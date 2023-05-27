import React, { useState } from "react";
import axios from "axios";
import MyComponent from "../components/MyComponent";
import styles from "../styles/styles.css";

export default function Home() {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [uploadStatus, setUploadStatus] = useState("");
  const [results, setResults] = useState([]);

  const handleFileInputChange = (event) => {
    // Handle the file input change event
    const files = event.target.files;
    setSelectedFiles([...selectedFiles, ...files]);
  };

  const handleRemoveFile = (index) => {
    // Remove the selected file from the file list
    const updatedFiles = [...selectedFiles];
    updatedFiles.splice(index, 1);
    setSelectedFiles(updatedFiles);
  };

  const handleUpload = async () => {
    // Handle the file upload
    setUploadStatus("Uploading...");
    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });

    try {
      const config = {
        headers: { "Content-Type": "multipart/form-data" },
      };
      const response = await axios.post(
        "http://localhost:5000/analyze-reviews",
        formData,
        config
      );

      const results = response.data.results;
      setResults(results);
      setUploadStatus("Upload successful!");
      setSelectedFiles([]);
    } catch (error) {
      setUploadStatus("Upload failed!");
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      {/* Render the MyComponent */}
      <MyComponent />
    </div>
  );
}
