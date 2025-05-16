import React,{ useState,useMemo,useContext } from 'react'




/**
 * Our custom React hook to manage state
 */

 const AppContext = React.createContext({})



const useAppState = () => {
  const initialState = {
    stateSessionClient: null,
    stateActiveLensProfile: null,
    isLoadingSession: null,
  }

  // Manage the state using React.useState()
  const [state, setState] = useState(initialState)

  // Build our actions. We'll use useMemo() as an optimization,
  // so this will only ever be called once.
  const actions = useMemo(() => getActions(setState), [setState])

  return { state, actions }
}

// Define your actions as functions that call setState().
// It's a bit like Redux's dispatch(), but as individual
// functions.
const getActions = (setState) => ({
  setStateActiveLensProfile: (profile) => {
    setState((state) => ({ ...state, stateActiveLensProfile: profile }))
  },
  setIsLoadingSession: (loading) => {
    setState((state) => ({ ...state, isLoadingSession: loading }))
  },
  setStateSessionClient: (stateSessionClient) => {
    setState((state) => ({ ...state, stateSessionClient: stateSessionClient }))
  },
})


const useAppContext = () => {
  return useContext(AppContext)
}

export { AppContext, useAppState, useAppContext }