import { useNavigate } from "react-router-dom";

const LandingPage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl w-full bg-white rounded-lg shadow-xl overflow-hidden">
        <div className="flex flex-col md:flex-row">
          <div className="md:w-1/2">
            <img
              src="https://i.imgur.com/II4MIrl.png"
              alt="Lightning Bolt Bug Zapper"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="md:w-1/2 p-8 flex flex-col justify-center">
            <h1 className="text-3xl font-bold text-gray-800 mb-4">
              Lightning Bolt Bug Zapper
            </h1>
            <p className="text-gray-600 mb-6">
              Quickly fix errors in Bolt.new by capturing error messages and
              code schemas with minimal clicks, then leveraging external LLMs to
              generate fixes.
            </p>
            <ul className="space-y-2 mb-8 text-gray-600">
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                One-click error and code selection
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Streamlined workflow with minimal interaction
              </li>
              <li className="flex items-start">
                <svg
                  className="h-5 w-5 text-green-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
                Leverage Claude 3.7 or Gemini 2.5 for fixes
              </li>
            </ul>
            <button
              onClick={() => navigate("/auth")}
              className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-3 px-4 rounded-md transition-colors duration-200"
            >
              Get Started
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LandingPage;
