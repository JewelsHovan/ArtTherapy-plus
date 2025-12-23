import { useNavigate } from 'react-router-dom';
import Button from '../components/common/Button';
import Logo from '../components/common/Logo';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-8">
          <Logo className="mx-auto" />
        </div>

        <div className="card-clean p-8">
          <div className="text-8xl font-bold text-primary mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Page Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The page you're looking for doesn't exist or has been moved.
          </p>

          <div className="space-y-3">
            <Button
              variant="primary"
              fullWidth
              onClick={() => navigate('/')}
            >
              Go Home
            </Button>
            <Button
              variant="outline"
              fullWidth
              onClick={() => navigate(-1)}
            >
              Go Back
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
