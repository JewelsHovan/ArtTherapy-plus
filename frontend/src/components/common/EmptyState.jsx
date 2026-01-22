import PropTypes from 'prop-types';

const EmptyState = ({
  icon,
  title,
  description,
  action,
  variant = 'default'
}) => {
  const isCompact = variant === 'compact';

  return (
    <div className={`text-center ${isCompact ? 'py-8' : 'py-16'}`}>
      {icon && (
        <div className={`mx-auto ${isCompact ? 'mb-4 w-16 h-16' : 'mb-8 w-32 h-32'} bg-gradient-to-br from-blue-100 to-orange-100 rounded-full flex items-center justify-center`}>
          {icon}
        </div>
      )}
      <h2 className={`${isCompact ? 'text-lg' : 'text-2xl'} font-semibold text-gray-800 mb-3`}>
        {title}
      </h2>
      {description && (
        <p className="text-gray-600 max-w-md mx-auto mb-8 leading-relaxed">
          {description}
        </p>
      )}
      {action}
    </div>
  );
};

EmptyState.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  action: PropTypes.node,
  variant: PropTypes.oneOf(['default', 'compact'])
};

export default EmptyState;
