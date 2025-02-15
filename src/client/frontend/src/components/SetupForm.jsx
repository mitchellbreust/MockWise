import { useState, useRef } from 'react';
import styled from 'styled-components';
import { API_URL } from '../config';

// Set up PDF.js with CDN worker
const Form = styled.form`
  width: 100%;
  max-width: 600px;
  margin: 0 auto;
  padding: 2rem;
  background: transparent;
  border-radius: 16px;
  box-shadow: var(--shadow-md);
  border: 1px solid rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(8px);

  h2 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    font-weight: 600;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  min-height: 120px;
  color: var(--text-primary);
  font-size: 1rem;
  line-height: 1.5;
  resize: vertical;
  transition: all 0.2s ease;

  &:focus {
    outline: none;
    border-color: var(--primary-color);
    box-shadow: 0 0 0 2px rgba(37, 99, 235, 0.1);
  }

  &::placeholder {
    color: var(--text-secondary);
  }
`;

const Button = styled.button`
  width: 100%;
  padding: 1rem;
  background-color: var(--primary-color);
  color: white;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 600;
  font-size: 1rem;
  transition: all 0.2s ease;
  
  &:hover:not(:disabled) {
    background-color: var(--primary-hover);
    transform: translateY(-1px);
  }

  &:active:not(:disabled) {
    transform: translateY(0);
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const ToggleContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  gap: 1rem;
`;

const ToggleButton = styled.button`
  padding: 0.75rem 1.5rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  background: ${props => props.$active ? 'var(--primary-color)' : 'transparent'};
  color: ${props => props.$active ? 'white' : 'var(--text-primary)'};
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-weight: 500;

  &:hover {
    background: ${props => props.$active ? 'var(--primary-hover)' : 'rgba(255, 255, 255, 0.1)'};
  }
`;

const FileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  width: 45%;
  height: 50%;
  padding: 2rem;
  border: 2px dashed rgba(255, 255, 255, 0.2);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  margin: 2rem auto;  // Added vertical margin and auto horizontal
  color: var(--text-secondary);
  transition: all 0.2s ease;
  display: flex;          // Added for better centering
  align-items: center;    // Added for better centering
  justify-content: center; // Added for better centering

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: rgba(255, 255, 255, 0.02);
  }
`;

const Section = styled.div`
  margin-bottom: 3rem;  // Increased from 2rem
`;

const SectionTitle = styled.h3`
  color: var(--text-primary);
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-underline-gap: 0.5rem;
`;

const InputGroup = styled.div`
  display: flex;
  gap: 1rem;
  margin-bottom: 1rem;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  text-align: center;
  margin: 2rem 0;  // Increased from 1rem
  color: var(--text-secondary);
  font-size: 0.9rem;

  &::before,
  &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  &::before {
    margin-right: 0.5em;
  }

  &::after {
    margin-left: 0.5em;
  }
`;

function SetupForm({ onSessionStart, setResume,  setJobInfo }) {
    const [tmpResume, setTmpResume] = useState('');
    const [tmpJobInfo, setTmpJobInfo] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const resumeFileRef = useRef(null);
    const jobFileRef = useRef(null);

    const handleFileSelect = () => {
        alert('File upload feature is not available yet. Please paste the content directly.');
    };

    const handleSubmit = async (e) => {
        e.preventDefault()
        setIsLoading(true)

        try {
            const response = await fetch(`${API_URL}/api/session`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resume: tmpResume, jobInfo: tmpJobInfo }),
            })

            const data = await response.json()
            if (data.sessionToken) {
              setResume(tmpResume);
              setJobInfo(tmpJobInfo);
              onSessionStart(data.sessionToken)  // This triggers the component swap in App.jsx
            } else {
                throw new Error('No session token received')
            }
        } catch (error) {
            console.error('Failed to start session:', error)
            alert('Failed to start interview session. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <Form onSubmit={handleSubmit}>
            <h2>Setup Interview</h2>
            
            {/* Resume Section */}
            <Section>
                <SectionTitle>Resume</SectionTitle>
                <FileInput
                    type="file"
                    id="resume-file"
                    accept=".txt,.pdf,.doc,.docx"
                    ref={resumeFileRef}
                    onChange={handleFileSelect}
                />
                <FileLabel htmlFor="resume-file">
                    Click to upload resume file
                </FileLabel>
                
                <OrDivider>or paste resume text</OrDivider>
                
                <TextArea
                    placeholder="Paste your resume here..."
                    value={tmpResume}
                    onChange={(e) => setTmpResume(e.target.value)}
                />
            </Section>

            {/* Job Description Section */}
            <Section>
                <SectionTitle>Job Description</SectionTitle>
                <FileInput
                    type="file"
                    id="job-file"
                    accept=".txt,.pdf,.doc,.docx"
                    ref={jobFileRef}
                    onChange={handleFileSelect}
                />
                <FileLabel htmlFor="job-file">
                    Click to upload job description file
                </FileLabel>
                
                <OrDivider>or paste job description</OrDivider>
                
                <TextArea
                    placeholder="Paste the job description here..."
                    value={tmpJobInfo}
                    onChange={(e) => setTmpJobInfo(e.target.value)}
                />
            </Section>

            <Button type="submit" disabled={isLoading || !tmpResume || !tmpJobInfo}>
                {isLoading ? 'Starting...' : 'Start Interview'}
            </Button>
        </Form>
    );
}

export default SetupForm;
