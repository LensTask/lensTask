import React,{ useState,useMemo,useContext } from 'react'




/**
 * Our custom React hook to manage state
 */

type AppStateType = {
  stateSessionClient: any;
  stateActiveLensProfile: any;
  isLoadingSession: any;
};

type AppActionsType = ReturnType<typeof getActions>;

type AppContextType = {
  state: AppStateType;
  actions: AppActionsType;
};

const AppContext = React.createContext<AppContextType | undefined>(undefined);



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
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppContext.Provider');
  }
  return context;
}

export { AppContext, useAppState, useAppContext }