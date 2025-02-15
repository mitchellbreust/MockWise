import { useState } from 'react'
import styled from 'styled-components'
import SetupForm from './components/SetupForm'
import InterviewChat from './components/InterviewChat'

const AppContainer = styled.div`
  width: 100%;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: start;
  box-sizing: border-box;

  @media (prefers-color-scheme: dark) {
    background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  }
`;

const Title = styled.h1`
  text-align: center;
  color: var(--text-primary);
  margin-bottom: 2rem;
  font-size: 2.5rem;
  font-weight: 700;
  text-shadow: var(--shadow-sm);
`;

function App() {
  const [sessionToken, setSessionToken] = useState(null)

  return (
    <AppContainer>
      <Title>MockWise: Interview Practice</Title>
      {!sessionToken ? (
        <SetupForm onSessionStart={setSessionToken} />
      ) : (
        <InterviewChat sessionToken={sessionToken} />
      )}
    </AppContainer>
  )
}

export default App
