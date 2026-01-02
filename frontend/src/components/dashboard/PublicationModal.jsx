import React from 'react';
import '../../styles/PublicationModal.css';

const PublicationModal = ({ publication, onClose }) => {
    if (!publication) return null;

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div
                className="modal-content"
                onClick={(e) => e.stopPropagation()}
            >
                <button className="modal-close-btn" onClick={onClose}>
                    ✕
                </button>

                <h2>{publication.title}</h2>

                <div className="modal-section">
                    <p><strong>Topic:</strong> {publication.topic_name || '—'}</p>
                    <p><strong>Country:</strong> {publication.country_name || '—'}</p>
                    <p><strong>City:</strong> {publication.city_name || '—'}</p>
                    <p><strong>University:</strong> {publication.university_name || '—'}</p>
                    <p><strong>Faculty:</strong> {publication.faculty_name || '—'}</p>
                </div>

                <div className="modal-section">
                    <p><strong>Description:</strong></p>
                    <p className="modal-description">
                        {publication.description || 'No description available.'}
                    </p>
                </div>

                <div className="modal-actions">
                    <button className="borrow-btn" disabled>
                        Borrow (soon)
                    </button>
                    <button className="secondary-btn" disabled>
                        Download (soon)
                    </button>
                </div>
            </div>
        </div>
    );
};

export default PublicationModal;
