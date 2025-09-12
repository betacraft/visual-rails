import React from 'react';
import './PageNavigation.css';

function PageNavigation({ currentPage, totalPages, onPageChange, subFlows }) {
  const handlePrevious = () => {
    // If we're on page 1 with subflows, handle subflow navigation
    if (subFlows && subFlows.visible > 1) {
      subFlows.onSubFlowChange(subFlows.visible - 1);
    } else if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    // If we're on page 1 with subflows, handle subflow navigation
    if (subFlows) {
      if (subFlows.visible < subFlows.total) {
        subFlows.onSubFlowChange(subFlows.visible + 1);
      } else {
        // All subflows visible, move to next page
        onPageChange(currentPage + 1);
      }
    } else if (currentPage < totalPages) {
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
        disabled={currentPage === 1 && (!subFlows || subFlows.visible === 1)}
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
        {subFlows ? (
          <>
            Page {currentPage}: {subFlows.visible}/{subFlows.total} flows
          </>
        ) : (
          <>{currentPage} / {totalPages}</>
        )}
      </div>

      <button 
        className="nav-arrow next"
        onClick={handleNext}
        disabled={currentPage === totalPages && !subFlows}
        aria-label="Next page"
      >
        →
      </button>
    </div>
  );
}

export default PageNavigation;