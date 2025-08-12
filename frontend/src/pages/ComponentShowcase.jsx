import { useState } from 'react';
import Logo from '../components/common/Logo';
import Button from '../components/common/Button';
import TextInput from '../components/forms/TextInput';

const ComponentShowcase = () => {
  const [inputValue, setInputValue] = useState('');

  return (
    <div className="min-h-screen bg-white p-8">
      <h1 className="text-4xl font-bold mb-8 text-primary">Component Showcase</h1>
      
      <div className="space-y-12">
        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Logo Component</h2>
          <div className="bg-gray-50 p-8 rounded-lg">
            <Logo />
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">Button Component</h2>
          <div className="bg-gray-50 p-8 rounded-lg space-y-4">
            <div>
              <p className="text-sm text-gray-600 mb-2">Primary Button (Large)</p>
              <Button variant="primary" size="large">Generate</Button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Primary Button (Medium)</p>
              <Button variant="primary" size="medium">Prompt</Button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Secondary Button</p>
              <Button variant="secondary" size="large">Inspire Me</Button>
            </div>
            <div>
              <p className="text-sm text-gray-600 mb-2">Outline Button</p>
              <Button variant="outline" size="medium">Visualize</Button>
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-semibold mb-4 text-gray-700">TextInput Component</h2>
          <div className="bg-gray-50 p-8 rounded-lg">
            <TextInput
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Describe your pain"
            />
            <p className="mt-4 text-gray-600">Current value: {inputValue}</p>
          </div>
        </section>
      </div>
    </div>
  );
};

export default ComponentShowcase;