// src/components/PublicationModal.jsx
import React from 'react';
import '../styles/Modal.css'; // отдельный CSS для модального окна

const PublicationModal = ({ publication, onClose }) => {
    if (!publication) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <h2>{publication.title}</h2>
                <p><strong>Author:</strong> {publication.author_name}</p>
                <p><strong>Topic:</strong> {publication.topic}</p>
                <p><strong>Country:</strong> {publication.country}</p>
                <p><strong>Faculty:</strong> {publication.faculty}</p>
                <button onClick={onClose}>Close</button>
            </div>
        </div>
    );
};

export default PublicationModal;
