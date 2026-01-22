import { useNavigate } from 'react-router-dom';
import Logo from '../components/common/Logo';

const About = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-orange-50">
      {/* Hero Section */}
      <section className="relative py-20 px-4">
        <div className="max-w-6xl mx-auto text-center">
          <div className="mb-8">
            <Logo />
          </div>
          <h1 className="text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Turning Pain Into Power
          </h1>
          <p className="text-xl text-gray-700 max-w-3xl mx-auto">
            Pain+ develops personalized, drug-free interventions for chronic pain by combining 
            arts-based mindfulness, neuroscience, and machine learning to give users and their 
            care teams new tools for understanding and managing pain.
          </p>
        </div>
      </section>

      {/* The Challenge Section */}
      <section className="py-16 px-4">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-primary">The Challenge We're Solving</h2>
              <p className="text-gray-700 mb-4">
                Chronic pain affects <span className="font-semibold">1 in 5 people</span>, yet fewer than 
                2% access specialized care. Among those who do, two-thirds are dissatisfied with available options.
              </p>
              <p className="text-gray-700 mb-4">
                One of the biggest challenges in pain care is communication. Pain is deeply personal—a 
                "4 out of 10" for one person may be an "8" for another. Culture, history, and emotion all 
                shape how we describe and interpret it.
              </p>
              <p className="text-gray-700">
                This makes standardized care difficult and leaves many patients under- or misdiagnosed, 
                especially children, non-verbal individuals, and culturally marginalized groups. 
                <span className="font-semibold"> Pain+ helps bridge this gap.</span>
              </p>
            </div>
            <div className="bg-white p-8 rounded-2xl shadow-xl">
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">📊</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Personalized Analytics</h3>
                    <p className="text-sm text-gray-600">Track patterns and warning signs of flare-ups</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🎨</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">Visual & Written Expression</h3>
                    <p className="text-sm text-gray-600">Multiple mediums to communicate your experience</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl">🤖</span>
                  <div>
                    <h3 className="font-semibold text-gray-800">AI-Powered Insights</h3>
                    <p className="text-sm text-gray-600">Our pain lexicon model understands your unique language</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-16 px-4 bg-white/50">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12 text-primary">How Pain+ Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h3 className="font-semibold mb-2">Describe Your Experience</h3>
              <p className="text-gray-600 text-sm">
                Share your pain experience in your own words, at your own pace
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h3 className="font-semibold mb-2">Create & Transform</h3>
              <p className="text-gray-600 text-sm">
                AI helps generate unique artwork that represents your journey
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">3</span>
              </div>
              <h3 className="font-semibold mb-2">Reflect & Grow</h3>
              <p className="text-gray-600 text-sm">
                Guided questions help you process and find meaning in your creation
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-blue-50 to-orange-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-primary text-center">Where Art Meets Science</h2>
          
          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-lg mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">It Began in an Art Museum</h3>
            <p className="text-gray-700 mb-4">
              In the fall of 2023, our co-founder Hannah visited the National Gallery of Art in Washington. 
              Watching restorers work with the same tools used in neuroscience labs—analyzing pigments, 
              repairing damage, uncovering hidden layers—a revelation struck:
            </p>
            <p className="text-gray-700 italic font-medium text-center py-4 text-lg">
              "We're asking the same questions—not about art, but about pain. 
              What's visible? What's hidden? What do we overlook?"
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-lg mb-8">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">From Pattern Recognition to Clinical Innovation</h3>
            <p className="text-gray-700 mb-4">
              Through a collaborative agreement with the National Gallery, we analyzed thousands of artworks 
              using AI, exploring how visual and text-based motifs of pain are represented across centuries.
            </p>
            <p className="text-gray-700">
              Now, as inaugural recipients of the McGill Raab Student Innovation Prize and hosted at the 
              Clinical Innovation Platform at Montreal General Hospital, we're turning these insights into 
              real-world tools for pain care.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur p-8 rounded-2xl shadow-lg">
            <h3 className="text-xl font-semibold mb-4 text-gray-800">The Pain+ Lexicon</h3>
            <p className="text-gray-700 mb-4">
              Our proprietary pain lexicon model—developed by our data scientist Julien—understands both 
              medical terminology and the lived vocabulary of pain. It doesn't just tag words; it assigns 
              contextual weight.
            </p>
            <p className="text-gray-700 italic">
              When someone writes "I feel pressure behind my eyes every evening," the model picks up on 
              temporal patterns and the emotional significance of that phrase.
            </p>
          </div>
        </div>
      </section>

      {/* Impact Section */}
      <section className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8 text-primary">Real Impact for Real People</h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-semibold text-lg mb-3">Reducing Diagnostic Delays</h3>
              <p className="text-gray-600">
                Conditions like endometriosis take 5-10 years to diagnose on average. 
                Our platform can detect patterns that help shorten this journey.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md">
              <h3 className="font-semibold text-lg mb-3">Empowering Communication</h3>
              <p className="text-gray-600">
                We're not replacing doctors—we're offering them a new layer of insight 
                to understand each patient's unique pain language.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">Start Your Creative Healing Journey</h2>
          <p className="text-gray-700 mb-8">
            Transform your pain into power through the healing art of creative expression.
          </p>
          <button 
            onClick={() => navigate('/mode')}
            className="bg-primary text-white px-8 py-4 rounded-lg text-lg font-semibold hover:bg-opacity-90 transition-all shadow-lg"
          >
            Begin Creating
          </button>
        </div>
      </section>
    </div>
  );
};

export default About;