import React from 'react';
import './PageNavigation.css';

function PageNavigation({ currentPage, totalPages, onPageChange }) {
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page) => {
    onPageChange(page);
  };

  return (
    <div className="page-navigation">
      <button 
        className="nav-arrow prev"
        onClick={handlePrevious}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        ←
      </button>

      <div className="page-indicators">
        {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
          <button
            key={page}
            className={`page-dot ${currentPage === page ? 'active' : ''}`}
            onClick={() => handlePageClick(page)}
            aria-label={`Go to page ${page}`}
            title={`Page ${page}`}
          >
            {page}
          </button>
        ))}
      </div>

      <div className="page-counter">
        {currentPage} / {totalPages}
      </div>

      <button 
        className="nav-arrow next"
        onClick={handleNext}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}

export default PageNavigation;