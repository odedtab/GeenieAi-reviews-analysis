import { useState } from "react";
import styles from "../styles/styles.css";

const Upload = ({ onFileInputChange, onDriveLinkInputChange }) => {
  const [driveLink, setDriveLink] = useState("");

  const handleFileInputChange = (event) => {
    // Handle the file input change event
    const files = event.target.files;
    onFileInputChange(files);
  };

  const handleDriveLinkInputChange = (event) => {
    // Handle the drive link input change event
    const link = event.target.value;
    setDriveLink(link);
    onDriveLinkInputChange(link);
  };

  return (
    <div className={styles.inputContainer}>
      {/* File input */}
      <input
        id="file-input"
        type="file"
        name="file"
        onChange={handleFileInputChange}
        multiple
      />
      <label htmlFor="file-input" className={styles.fileInputLabel}>
        Select File
      </label>
      {/* Drive link input */}
      <input
        type="text"
        name="drive-link"
        placeholder="Enter Google Drive link"
        value={driveLink}
        onChange={handleDriveLinkInputChange}
      />
    </div>
  );
};

export default Upload;
