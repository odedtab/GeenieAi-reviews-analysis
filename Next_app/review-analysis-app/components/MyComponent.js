import { useState } from "react";
import axios from "axios";
import Upload from "./Upload";
import styles from "../styles/styles.css";

const MyComponent = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [driveLink, setDriveLink] = useState("");
  const [uploadStatus, setUploadStatus] = useState("");
  const [results, setResults] = useState([]);

  const handleFileInputChange = (files) => {
    // Handle the file input change event
    setSelectedFiles((prevSelectedFiles) => [...prevSelectedFiles, ...files]);
  };

  const handleDriveLinkInputChange = (link) => {
    // Handle the drive link input change event
    setDriveLink(link);
  };

  const handleRemoveFile = (index) => {
    // Remove the selected file from the file list
    setSelectedFiles((prevSelectedFiles) => {
      const updatedSelectedFiles = [...prevSelectedFiles];
      updatedSelectedFiles.splice(index, 1);
      return updatedSelectedFiles;
    });
  };

  const handleUpload = async () => {
    // Handle the file upload
    setUploadStatus("Uploading files...");

    const formData = new FormData();
    selectedFiles.forEach((file) => {
      formData.append("file", file);
    });
    formData.append("driveLink", driveLink);

    try {
      const response = await axios.post(
        "http://localhost:5000/analyze-reviews",
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setResults(response.data.results);
      setUploadStatus("");
    } catch (error) {
      setUploadStatus("Error occurred while uploading files.");
    }
  };

  return (
    <div className={styles.container} style={{ backgroundColor: "#1d1c27" }}>
      <h1>Review Analysis App</h1>
      {/* Render the Upload component */}
      <Upload
        onFileInputChange={handleFileInputChange}
        onDriveLinkInputChange={handleDriveLinkInputChange}
      />
      <div className={styles.uploadedFilesContainer}>
        {selectedFiles.map((file, index) => (
          <div key={index} className={styles.uploadedFile}>
            <p>{file.name}</p>
            <button
              className={styles.removeButton}
              onClick={() => handleRemoveFile(index)}
            >
              X
            </button>
          </div>
        ))}
      </div>
      <div className={styles.buttonContainer}>
        <button
          className={styles.addButton}
          onClick={() => document.getElementById("file-input").click()}
          style={{ backgroundColor: "orange" }}
        >
          Add File
        </button>
      </div>
      <div className={styles.buttonContainer}>
        <button
          className={styles.uploadButton}
          onClick={handleUpload}
          style={{ backgroundColor: "orange" }}
        >
          Upload
        </button>
      </div>
      {uploadStatus && <p>{uploadStatus}</p>}
      {results.map((result, index) => (
        <div key={index} className={styles.resultContainer}>
          <p>Result {index + 1}:</p>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ))}
    </div>
  );
};

export default MyComponent;
