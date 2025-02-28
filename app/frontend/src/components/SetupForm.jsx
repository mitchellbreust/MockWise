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
  border: 1px solid var(--border);
  backdrop-filter: blur(8px);
  
  h2 {
    color: var(--text-primary);
    margin-bottom: 1.5rem;
    font-size: 1.8rem;
    font-weight: 600;
  }

  @media (max-width: 768px) {
    padding: 1rem;
    width: 90%;
    h2 {
      font-size: 1.5rem;
      margin-bottom: 1rem;
    }
  }

  @media (max-width: 480px) {
    width: 95%;
    padding: 0.8rem;
  }
`;

const TextArea = styled.textarea`
  width: 100%;
  max-width: 100%;  /* Prevents overflow */
  box-sizing: border-box;  /* Ensures it fits within its container */
  margin-bottom: 1.5rem;
  padding: 1rem;
  background: var(--foreground);
  border: 1px solid var(--border);
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
    box-shadow: 0 0 0 2px var(--primary-hover);
  }

  &::placeholder {
    color: var(--text-secondary);
  }

  @media (max-width: 768px) {
    min-height: 100px;
    font-size: 0.95rem;
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
    opacity: 0.5;
    cursor: not-allowed;
  }

  @media (max-width: 480px) {
    font-size: 0.9rem;
    padding: 0.8rem;
  }
`;


const FileInput = styled.input`
  display: none;
`;

const FileLabel = styled.label`
  width: 100%;
  padding: 1.5rem;
  border: 2px dashed var(--border);
  border-radius: 8px;
  text-align: center;
  cursor: pointer;
  color: var(--text-secondary);
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;

  &:hover {
    border-color: var(--primary-color);
    color: var(--primary-color);
    background: rgba(255, 255, 255, 0.02);
  }

  @media (max-width: 768px) {
    padding: 1rem;
    font-size: 0.9rem;
  }
`;

const Section = styled.div`
  margin-bottom: 3rem;  // Increased from 2rem
  @media (max-width: 768px) {
    margin-bottom: 2rem;
  }
`;

const SectionTitle = styled.h3`
  color: var(--text-primary);
  font-size: 1.2rem;
  margin-bottom: 1rem;
  font-weight: 500;
  text-decoration: underline;
  text-decoration-underline-gap: 0.5rem;
  @media (max-width: 768px) {
    font-size: 1.1rem;
  }
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

function SetupForm({ onSessionStart, setResume,  setJobInfo, setEphemeralToken }) {
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
            const response = await fetch(`${API_URL}/create-interview`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ resume: tmpResume, job: tmpJobInfo }),
                credentials: "include"
            })

            const data = await response.json()
            if (data.session && data.token) {
              setResume(tmpResume);
              setJobInfo(tmpJobInfo);
              setEphemeralToken(data.token)
              onSessionStart(data.session)  // This triggers the component swap in App.jsx
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