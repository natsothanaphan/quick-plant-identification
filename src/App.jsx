import { useState, useRef } from 'react'
import './App.css'
import { identifyPlant } from './api/plantIdentifier'

function App() {
  // State variables to manage file selection, preview, loading, result, and errors
  const [selectedFile, setSelectedFile] = useState(null)
  const [previewUrl, setPreviewUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [result, setResult] = useState(null)

  // Refs for file input and to cancel pending requests
  const fileInputRef = useRef(null)
  const activeRequestId = useRef(0) // Used to cancel lingering async requests

  // When a user selects a file, update state and create an object URL for preview
  const handleFileChange = (event) => {
    const file = event.target.files?.[0]
    setError('')
    setResult(null)

    if (file) {
      // Validate file type
      if (file.type !== 'image/jpeg' && file.type !== 'image/png') {
        setError('Please select a JPEG or PNG image')
        return
      }
      // Create a preview URL
      const url = URL.createObjectURL(file)
      setPreviewUrl(url)
      setSelectedFile(file)
    }
  }

  // Convert the selected file into a base64 string (without the data URI prefix)
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          const base64Index = reader.result.indexOf('base64,')
          // Remove the prefix: "data:image/jpeg;base64," (or "data:image/png;base64,")
          const base64Str = reader.result.substring(base64Index + 7)
          resolve(base64Str)
        } else {
          resolve(reader.result)
        }
      }
      reader.onerror = (error) => reject(error)
    })
  }

  // Handle form submission: convert file, call the Firebase Function endpoint, and update state
  const handleSubmit = async (event) => {
    event.preventDefault()
    setError('')
    setResult(null)

    if (!selectedFile) {
      setError('No file selected')
      return
    }

    // Increment the request Id and capture the current value.
    activeRequestId.current++
    const thisRequestId = activeRequestId.current

    setLoading(true)
    try {
      // Convert the file to base64
      const base64Str = await convertToBase64(selectedFile)
      // Check if a reset / new request has cancelled this one
      if (thisRequestId !== activeRequestId.current) return

      // Call the identifyPlant API (mock implementation) from the separate module
      const data = await identifyPlant({ mimeType: selectedFile.type, imageData: base64Str })
      if (thisRequestId !== activeRequestId.current) return

      setResult(data)
    } catch (err) {
      if (thisRequestId !== activeRequestId.current) return
      setError(err.message)
    } finally {
      if (thisRequestId !== activeRequestId.current) return
      setLoading(false)
    }
  }

  // Reset the form and clear all states and also reset the input element
  const handleReset = () => {
    // Invalidate any pending async operations by incrementing the request id.
    activeRequestId.current++

    setSelectedFile(null)
    setPreviewUrl('')
    setLoading(false)
    setResult(null)
    setError('')
    if (fileInputRef.current) {
      fileInputRef.current.value = null; // Reset file input value
    }
  }

  return (
    <div className="App">
      <h1>Quick Plant Identification</h1>
      <form onSubmit={handleSubmit}>
        <input 
          type="file" 
          accept="image/jpeg, image/png"
          ref={fileInputRef} // Attach the ref to the input element
          onChange={handleFileChange} 
        />
        {previewUrl && (
          <div>
            <img 
              src={previewUrl} 
              alt="Preview" 
              className="preview-img" 
            />
          </div>
        )}
        {selectedFile && (
          <button type="submit" disabled={loading}>
            Request Identification
          </button>
        )}
      </form>
      
      {loading && <p>Loading...</p>}
      {error && <p className="error-message">Error: {error}</p>}
      
      {result && (
        <div className="result-container">
          {/* Display each field returned by your Gemini API */}
          <p>
            <strong>Scientific name:</strong> <em>{result["1-scientificName"]}</em>
          </p>
          <p>
            <strong>Common names:</strong> {result["2-commonNames"].join(', ')}
          </p>
          <p>
            <strong>Confidence score:</strong> {result["3-confidenceProb"]}
          </p>
          <p>
            <strong>Further explanation:</strong> {result["4-userExplanation"]}
          </p>
        </div>
      )}
      
      <button onClick={handleReset} className="reset-button">
        Reset
      </button>
    </div>
  )
}

export default App
