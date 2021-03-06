import { createActionThunk, errorSelector, indexedAction } from '../../redux'
import api from './api'

const CREATE_SOURCE_ACTION = "sources/create";
const EDIT_SOURCE_ACTION = "sources/edit";

const createSourceAction = createActionThunk(CREATE_SOURCE_ACTION, api.create);
const editSourceAction = createActionThunk(EDIT_SOURCE_ACTION, api.update);

const createSourceErrorSelector = errorSelector(
  indexedAction(CREATE_SOURCE_ACTION)
);
const editSourceErrorSelector = errorSelector(
  indexedAction(EDIT_SOURCE_ACTION)
);

export {
  createSourceAction,
  createSourceErrorSelector,
  editSourceAction,
  editSourceErrorSelector
};
