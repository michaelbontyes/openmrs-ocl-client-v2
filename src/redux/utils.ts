import { AxiosResponse } from "axios";
import { Action, IndexedAction } from "./types";

const RESET = "RESET";
const START = "START";
const FAILURE = "FAILURE";
const PROGRESS = "PROGRESS";
const COMPLETE = "COMPLETE";

export const loading = (actionType: string): string => `${actionType}Loading`;
export const progress = (actionType: string): string => `${actionType}Progress`;
export const errors = (actionType: string): string => `${actionType}Errors`;

const createActionType = (actionType: string): Function => (): {
  [key: string]: string;
} => ({ type: actionType });

const indexedAction = (
  action: string,
  actionIndex: number = 0
): IndexedAction => ({ actionType: action, actionIndex });

export function action(type: string) {
  return { type };
}

const resetAction = (actionType: string) => ({
  type: `${actionType}_${RESET}`
});

const startAction = (
  { actionType, actionIndex }: IndexedAction,
  ...args: any[]
) => ({
  type: `${actionType}_${START}`,
  actionIndex,
  meta: args
});

const progressAction = (
  { actionType, actionIndex }: IndexedAction,
  payload: string
) => ({
  type: `${actionType}_${PROGRESS}`,
  actionIndex,
  payload
});

const completeAction = (
  { actionType, actionIndex }: IndexedAction,
  ...args: any[]
) => ({
  type: `${actionType}_${COMPLETE}`,
  actionIndex,
  meta: args
});

const createActionThunk = <T extends any[]>(
  actionOrActionType: IndexedAction | string,
  task: (...args: T) => Promise<AxiosResponse<any>>
) => {
  /*
   ** Create an redux thunk that dispatches start, runs task, dispatched success/failure and completed actions
   */

  const action: IndexedAction =
    typeof actionOrActionType === "string"
      ? indexedAction(actionOrActionType)
      : actionOrActionType;
  const { actionType, actionIndex } = action;

  return <S>(...args: T) => {
    return async (dispatch: (action: Action) => {}): Promise<boolean | S> => {
      let result = true;

      try {
        dispatch(startAction(action, ...args));

        try {
          const response = await task(...args);
          dispatch({
            type: actionType,
            actionIndex: actionIndex,
            payload: response.data,
            meta: args,
            responseMeta: response.headers
          });

          result = response.data;
        } catch (error) {
          console.log(error);
          dispatch({
            type: `${actionType}_${FAILURE}`,
            actionIndex: actionIndex,
            payload: error.response.data,
            meta: args
          });
          result = false;
        }
      } catch (error) {
        console.log("should not happen", error);

        dispatch({
          type: `${actionType}_${FAILURE}`,
          actionIndex: actionIndex,
          payload: { __all__: ["The action could not be completed (1)"] },
          meta: args
        });

        result = false;
      } finally {
        dispatch(completeAction(action, ...args));
      }
      return result;
    };
  };
};

export {
  createActionType,
  createActionThunk,
  resetAction,
  startAction,
  progressAction,
  completeAction,
  indexedAction,
  FAILURE
};
