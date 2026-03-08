import { useCallback, useEffect, useMemo, useRef, useState } from "react"

export type VoiceInputState = "idle" | "listening" | "processing" | "error"

type UseChromeSpeechInputOptions = {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

type UseChromeSpeechInputResult = {
  isSupported: boolean
  state: VoiceInputState
  error: string | null
  start: () => void
  stop: () => void
  toggle: () => void
  resetError: () => void
}

function getSpeechRecognitionConstructor(): SpeechRecognitionConstructor | null {
  if (typeof window === "undefined") return null
  return window.SpeechRecognition ?? window.webkitSpeechRecognition ?? null
}

function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim()
}

function appendWithSpacing(base: string, incoming: string): string {
  const left = base.trimEnd()
  const right = normalizeWhitespace(incoming)

  if (!left) return right
  if (!right) return left
  if (/^[,.;!?)]/.test(right)) return `${left}${right}`
  if (/[([{/"'`-]$/.test(left)) return `${left}${right}`
  return `${left} ${right}`
}

function mapSpeechRecognitionError(error: SpeechRecognitionErrorCode): string {
  if (error === "not-allowed" || error === "service-not-allowed") {
    return "Microphone access was denied. Allow microphone permissions and try again."
  }
  if (error === "audio-capture") {
    return "No microphone was detected. Check your audio input and try again."
  }
  if (error === "network") {
    return "A network error interrupted voice input. Please try again."
  }
  if (error === "language-not-supported") {
    return "Speech recognition is not available for this browser language."
  }
  if (error === "no-speech") {
    return "No speech was detected. Try again and speak clearly."
  }
  return "Voice input failed. Please try again."
}

function composeInput(baseText: string, finalTranscript: string, interimTranscript: string): string {
  const finalText = normalizeWhitespace(finalTranscript)
  const interimText = normalizeWhitespace(interimTranscript)
  const spokenText = appendWithSpacing(finalText, interimText)
  if (!spokenText) return baseText
  return appendWithSpacing(baseText, spokenText)
}

export function useChromeSpeechInput({
  value,
  onChange,
  disabled = false,
}: UseChromeSpeechInputOptions): UseChromeSpeechInputResult {
  const [state, setState] = useState<VoiceInputState>("idle")
  const [error, setError] = useState<string | null>(null)

  const onChangeRef = useRef(onChange)
  const recognitionRef = useRef<SpeechRecognition | null>(null)
  const hasErrorRef = useRef(false)
  const baseTextRef = useRef("")

  const isSupported = useMemo(() => getSpeechRecognitionConstructor() !== null, [])

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const clearRecognition = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    recognition.onstart = null
    recognition.onresult = null
    recognition.onerror = null
    recognition.onend = null
    recognitionRef.current = null
  }, [])

  const stop = useCallback(() => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (state === "listening") {
      setState("processing")
    }
    try {
      recognition.stop()
    } catch {
      setState((prev) => (prev === "error" ? prev : "idle"))
      clearRecognition()
    }
  }, [clearRecognition, state])

  const start = useCallback(() => {
    if (disabled) return
    if (!isSupported) {
      setError("Voice input is only available in Chrome-compatible browsers.")
      setState("error")
      return
    }
    if (state === "listening" || state === "processing") return

    const Recognition = getSpeechRecognitionConstructor()
    if (!Recognition) {
      setError("Voice input is only available in Chrome-compatible browsers.")
      setState("error")
      return
    }

    const recognition = new Recognition()
    hasErrorRef.current = false
    baseTextRef.current = value
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = navigator.language || "en-US"

    recognition.onstart = () => {
      setError(null)
      setState("listening")
    }

    recognition.onresult = (event) => {
      let nextFinal = ""
      let nextInterim = ""

      for (let index = 0; index < event.results.length; index += 1) {
        const result = event.results[index]
        const transcript = result[0]?.transcript ?? ""
        if (!transcript) continue

        if (result.isFinal) {
          nextFinal = appendWithSpacing(nextFinal, transcript)
        } else {
          nextInterim = appendWithSpacing(nextInterim, transcript)
        }
      }

      onChangeRef.current(composeInput(baseTextRef.current, nextFinal, nextInterim))
    }

    recognition.onerror = (event) => {
      hasErrorRef.current = true
      setError(mapSpeechRecognitionError(event.error))
      setState("error")
    }

    recognition.onend = () => {
      clearRecognition()
      if (hasErrorRef.current) return
      setState("idle")
    }

    recognitionRef.current = recognition

    try {
      recognition.start()
    } catch {
      clearRecognition()
      setError("Voice input could not be started. Please try again.")
      setState("error")
    }
  }, [clearRecognition, disabled, isSupported, state, value])

  const toggle = useCallback(() => {
    if (state === "listening" || state === "processing") {
      stop()
      return
    }
    start()
  }, [start, state, stop])

  const resetError = useCallback(() => {
    setError(null)
    setState((prev) => (prev === "error" ? "idle" : prev))
  }, [])

  useEffect(() => {
    if (!disabled) return
    const recognition = recognitionRef.current
    if (!recognition) return
    try {
      recognition.stop()
    } catch {
      clearRecognition()
    }
  }, [clearRecognition, disabled])

  useEffect(() => {
    return () => {
      const recognition = recognitionRef.current
      if (!recognition) return
      clearRecognition()
      try {
        recognition.abort()
      } catch {
        // Ignore cleanup errors.
      }
    }
  }, [clearRecognition])

  return {
    isSupported,
    state,
    error,
    start,
    stop,
    toggle,
    resetError,
  }
}
