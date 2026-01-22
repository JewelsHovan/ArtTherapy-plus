import PropTypes from 'prop-types';

const PageHeader = ({ title, description, actions, className = '' }) => {
  return (
    <div className={`card-clean mb-8 animate-fadeIn ${className}`}>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-2">{title}</h1>
          {description && (
            <p className="text-gray-600">{description}</p>
          )}
        </div>
        {actions && (
          <div className="flex gap-3 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
};

PageHeader.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
  className: PropTypes.string
};

export default PageHeader;
