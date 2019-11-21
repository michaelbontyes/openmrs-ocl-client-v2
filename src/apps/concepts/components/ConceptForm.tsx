import React, { useEffect, useRef, useState } from 'react'
import { ErrorMessage, Field, FieldArray, Form, Formik } from 'formik'
import { ConceptDescription, ConceptName, Mapping, Concept } from '../types'
import uuid from 'uuid'
import {
    Button,
    createStyles,
    FormControl,
    IconButton,
    InputAdornment,
    InputLabel,
    makeStyles,
    MenuItem,
    Paper,
    Theme,
    Typography
} from '@material-ui/core'
import { Select, TextField } from 'formik-material-ui'
import {
  CONCEPT_CLASSES,
  DATA_TYPES,
  getPrettyError,
  MAP_TYPE_CONCEPT_SET,
  MAP_TYPE_Q_AND_A,
  NAME_TYPES
} from '../../../utils'
import NamesTable from './NamesTable'
import { Edit as EditIcon } from '@material-ui/icons'
import * as Yup from 'yup'
import MappingsTable from './MappingsTable'

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
      buttonContainer: {
        textAlign: 'center',
      },
  }),
);

const castNecessaryValues = (values: Concept) => {
    const {names} = values;
    return {
        ...values,
        names: names.map((name: ConceptName) => ({
            ...name,
            name_type: name.name_type === 'null' ? null : name.name_type, // api represents 'Synonym' name_type as null
        })),
    };
};

const createName = (nameType: string=NAME_TYPES[0].value): ConceptName => ({
    name: "",
    locale: "",
    external_id: uuid(),
    locale_preferred: false,
    name_type: nameType,
});

const createDescription = (): ConceptDescription => ({
    description: "",
    locale: "",
    external_id: uuid(),
    locale_preferred: false,
});

const createMapping = (map_type: string=''): Mapping => ({
  external_id: uuid(),
  from_concept_url: '',
  to_source_url: '',
  map_type,
});

const initialValues: Concept = {
    concept_class: "",
    datatype: DATA_TYPES[0],
    descriptions: [],
    external_id: uuid(),
    id: "",
    answers: [],
    sets: [],
    mappings: [createMapping()],
    names: [createName()],
};

const MappingSchema = Yup.object().shape<Mapping>({
    external_id: Yup.string(),
    from_concept_url: Yup.string(),
    map_type: Yup.string().required('Required'),
    to_source_url: Yup.string().required('Required'),
    to_concept_code: Yup.string().notRequired(),
    to_concept_url: Yup.string().notRequired(),
    to_concept_name: Yup.string().notRequired(),
  })
    .test('User should select a to concept', 'A to concept is required', (value: Mapping) => !!value.to_concept_code || !!value.to_concept_url);

const ConceptSchema = Yup.object().shape<Concept>({
  concept_class: Yup.string()
    .required('Required'),
  datatype: Yup.string()
    .required('Required'),
  names: Yup.array().of(Yup.object().shape<ConceptName>({
    name: Yup.string().required('Required'),
    name_type: Yup.string().required('Required'),
    external_id: Yup.string().required(),
    locale: Yup.string().required('Required'),
    locale_preferred: Yup.boolean().required('Required'),
  }))
    .min(1, 'Concept must have at least one name'),
  descriptions: Yup.array().of(Yup.object().shape<ConceptDescription>({
    description: Yup.string().required('Required'),
    external_id: Yup.string().required(),
    locale: Yup.string().required('Required'),
    locale_preferred: Yup.boolean().required('Required'),
  }))
    .min(0),
  external_id: Yup.string()
    .required(),
  id: Yup.string()
    .required('Required'),
  answers: Yup.array().of(MappingSchema)
    .min(0),
  sets: Yup.array().of(MappingSchema)
    .min(0),
  mappings: Yup.array().of(MappingSchema)
    .min(0),
});

interface Props {
    loading: boolean,
    createConcept?: Function,
    errors?: {},
    editing? : boolean,
    savedValues?: Concept,
}

const ConceptForm: React.FC<Props> = ({loading, createConcept, errors, editing=false, savedValues}) => {
    const classes = useStyles();

    const formikRef: any = useRef(null);

    const [isExternalIDEditable, setExternalIDEditable] = useState(false);
    const toggleExternalIDEditable = () => setExternalIDEditable(!isExternalIDEditable);

    useEffect(() => {
        const {current: currentRef} = formikRef;
        if (currentRef) {
            currentRef.setSubmitting(loading);
        }
    }, [loading]);

    useEffect(() => {
        const {current: currentRef} = formikRef;
        if (!currentRef) return;

        Object.keys(initialValues).forEach((key) => {
            const error = getPrettyError(errors, key);
            if (error) currentRef.setFieldError(key, error);
        });
    }, [errors]);

    return (
        <Formik
          ref={formikRef}
          initialValues={savedValues || initialValues}
          validationSchema={ConceptSchema}
          onSubmit={values => {
            if (createConcept) createConcept(castNecessaryValues(values));
          }}
        >
            {({isSubmitting, status, values, errors, handleChange}) => (
                <Form>
                    <Paper className="fieldsetParent">
                        <fieldset>
                            <Typography component="legend" variant="h5" gutterBottom>Concept Details</Typography>
                            <Field
                              fullWidth
                              id="external_id"
                              name="external_id"
                              label="OpenMRS UUID (OCL External ID)"
                              margin="normal"
                              disabled={!isExternalIDEditable}
                              component={TextField}
                              InputProps={{
                                  endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton
                                          aria-label="toggle external id editable"
                                          onClick={toggleExternalIDEditable}
                                        >
                                            <EditIcon />
                                        </IconButton>
                                    </InputAdornment>
                                  ),
                              }}
                            />
                            <Field
                              fullWidth
                              id="id"
                              name="id"
                              label="OCL ID"
                              margin="normal"
                              component={TextField}
                            />
                            <FormControl
                              fullWidth
                              margin="normal"
                            >
                                <InputLabel htmlFor="concept_class">Class</InputLabel>
                                <Field
                                  name="concept_class"
                                  id="concept_class"
                                  component={Select}
                                >
                                    {CONCEPT_CLASSES.map(conceptClass => <MenuItem key={conceptClass} value={conceptClass}>{conceptClass}</MenuItem>)}
                                </Field>
                                <Typography color="error" variant="caption" component="div">
                                    <ErrorMessage name="concept_class" component="span"/>
                                </Typography>
                            </FormControl>
                            <FormControl
                              fullWidth
                              margin="normal"
                            >
                                <InputLabel htmlFor="class">Datatype</InputLabel>
                                <Field
                                  name="datatype"
                                  id="datatype"
                                  component={Select}
                                >
                                    {DATA_TYPES.map(datatype => <MenuItem key={datatype} value={datatype}>{datatype}</MenuItem>)}
                                </Field>
                                <Typography color="error" variant="caption" component="div">
                                    <ErrorMessage name="datatype" component="span"/>
                                </Typography>
                            </FormControl>
                        </fieldset>
                    </Paper>
                    <br/>
                    <Paper className="fieldsetParent">
                        <fieldset>
                            <Typography component="legend" variant="h5" gutterBottom>Names</Typography>
                            <FieldArray name="names">
                                {arrayHelpers => (
                                  <NamesTable
                                    useTypes
                                    createNewValue={() => createName(NAME_TYPES[1].value)}
                                    type="name"
                                    title="Name"
                                    valuesKey="names"
                                    values={values.names}
                                    errors={errors.names}
                                    arrayHelpers={arrayHelpers}
                                    isSubmitting={isSubmitting}
                                  />
                                )}
                            </FieldArray>
                        </fieldset>
                    </Paper>
                    <br/>
                    <Paper className="fieldsetParent">
                        <fieldset>
                            <Typography component="legend" variant="h5" gutterBottom>Descriptions</Typography>
                            <FieldArray name="descriptions">
                                {arrayHelpers => (
                                  <NamesTable
                                    multiline
                                    createNewValue={createDescription}
                                    type="description"
                                    title="Description"
                                    valuesKey="descriptions"
                                    values={values.descriptions}
                                    errors={errors.descriptions}
                                    arrayHelpers={arrayHelpers}
                                    isSubmitting={isSubmitting}
                                  />
                                )}
                            </FieldArray>
                        </fieldset>
                    </Paper>
                  <br/>
                  <Paper className="fieldsetParent">
                    <fieldset>
                      <Typography component="legend" variant="h5" gutterBottom>Answers</Typography>
                      <FieldArray name="answers">
                        {arrayHelpers => (
                          <MappingsTable
                            allowChoosingType
                            createNewMapping={() => createMapping(MAP_TYPE_Q_AND_A.value)}
                            valuesKey="answers"
                            values={values.answers}
                            errors={errors.answers}
                            arrayHelpers={arrayHelpers}
                            isSubmitting={isSubmitting}
                            handleChange={handleChange}
                            title="answer"
                            fixedMappingType={MAP_TYPE_Q_AND_A}
                          />
                        )}
                      </FieldArray>
                    </fieldset>
                  </Paper>
                  <br/>
                  <Paper className="fieldsetParent">
                    <fieldset>
                      <Typography component="legend" variant="h5" gutterBottom>Sets</Typography>
                      <FieldArray name="sets">
                        {arrayHelpers => (
                          <MappingsTable
                            allowChoosingType
                            createNewMapping={() => createMapping(MAP_TYPE_CONCEPT_SET.value)}
                            valuesKey="sets"
                            values={values.sets}
                            errors={errors.sets}
                            arrayHelpers={arrayHelpers}
                            isSubmitting={isSubmitting}
                            handleChange={handleChange}
                            title="set"
                            fixedMappingType={MAP_TYPE_CONCEPT_SET}
                          />
                        )}
                      </FieldArray>
                    </fieldset>
                  </Paper>
                    <br/>
                    <Paper className="fieldsetParent">
                      <fieldset>
                        <Typography component="legend" variant="h5" gutterBottom>Mappings</Typography>
                        <FieldArray name="mappings">
                          {arrayHelpers => (
                            <MappingsTable
                              allowChoosingType
                              createNewMapping={createMapping}
                              valuesKey="mappings"
                              values={values.mappings}
                              errors={errors.mappings}
                              arrayHelpers={arrayHelpers}
                              isSubmitting={isSubmitting}
                              handleChange={handleChange}
                              title="mapping"
                            />
                          )}
                        </FieldArray>
                      </fieldset>
                    </Paper>
                    <br/>
                    <div className={classes.buttonContainer}>
                        <Button
                          variant="outlined"
                          color="primary"
                          size="large"
                          type="submit"
                          disabled={isSubmitting}
                        >
                            Submit
                        </Button>
                    </div>
                </Form>
            )}
        </Formik>
    );
};

export default ConceptForm;