import React, { useCallback, useEffect, useState } from 'react'
import { CButton, CCol, CForm, CFormLabel, CFormSelect, CRow } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilImage, cilCode } from '@coreui/icons'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-toast'

import {
  ExperimentBasicFragment,
  ExperimentSchemaFragment,
  ExperimentDemoFragment,
  useExperimentSchemasQuery,
  useExperimentDemosQuery,
  UserExperimentArgInput,
  UserExperimentDashboardFragment,
} from '__generated__/graphql'
import { ErrorNotifier, ModalPreview, DemoPreview, SpinnerOverlay } from 'components'
import { ArgumentBasic, ExperimentFormInput } from 'types'
import ExperimentFormArgument from './ExperimentFormArgument'

type Props = {
  experiments: ExperimentBasicFragment[]
  userExperimentCurrent?: UserExperimentDashboardFragment
  disableCommandSelect?: boolean
  handleSubmitForm: (input: ExperimentFormInput) => void
  submitBtnText?: string
  handleStop?: () => void
  disabled?: boolean
  hasError?: boolean
}

interface ArgumentsRow {
  [key: number]: ArgumentBasic[]
}

const formatArguments = (args: ArgumentBasic[]) => {
  let formatted: ArgumentsRow = {}
  args.forEach((arg) => {
    if (arg.row <= 0) return;
    if (!(arg.row in formatted)) formatted[arg.row] = []

    formatted[arg.row] = [...formatted[arg.row], arg]
  })

  Object.keys(formatted).forEach((key) => {
    const index = parseInt(key)
    formatted[index] = formatted[index].sort(
      (a, b) => a.order - b.order,
    )
  })

  return formatted
}

const ExperimentForm: React.FC<Props> = ({
  experiments,
  userExperimentCurrent,
  disableCommandSelect = false,
  handleSubmitForm,
  submitBtnText,
  handleStop,
  disabled = false,
  hasError = false
}: Props) => {
  const { t } = useTranslation()

  const [visiblePreview, setVisiblePreview] = useState(false)
  const [selectedInputType, setSelectedInputType] = useState<string>("code")
  const inputTypes = ["code", "file", "demo"]

  const [selectedExperiment, setSelectedExperiment] = useState<ExperimentBasicFragment | undefined>(
    experiments[0],
  )
  const [selectedSchema, setSelectedSchema] = useState<ExperimentSchemaFragment | undefined>()
  const [selectedDemo, setSelectedDemo] = useState<ExperimentDemoFragment | undefined>() // Added state for selected demo
  
  const [selectedCommand, setSelectedCommand] = useState<string | undefined>(
    experiments[0].commands[0] || undefined,
  )

  const [experimentInput, setExperimentInput] = useState<UserExperimentArgInput[]>([])

  const { data: schemaData, loading: schemaLoading, error: schemaError } = useExperimentSchemasQuery({ 
    notifyOnNetworkStatusChange: true,
    variables: {
      deviceTypeId: (userExperimentCurrent?.experiment.device?.deviceType.id ||
        selectedExperiment?.deviceType.id) as string,
      softwareId:
        userExperimentCurrent?.experiment.software.id ||
        (selectedExperiment?.software.id as string),
    },
  })

  const { data: demoData, loading: demoLoading, error: demoError } = useExperimentDemosQuery({
    notifyOnNetworkStatusChange: true,
    variables: {
      deviceTypeId: (userExperimentCurrent?.experiment.device?.deviceType.id ||
        selectedExperiment?.deviceType.id) as string,
      softwareId:
        userExperimentCurrent?.experiment.software.id ||
        (selectedExperiment?.software.id as string),
    },
  });

  const getCommands = useCallback(
    (ue?: UserExperimentDashboardFragment) => {
      if (!ue && !userExperimentCurrent && selectedExperiment?.commands.includes('start'))
        return ['start']

      let experiment
      if (ue) {
        experiment = experiments.find((e) => e.id === ue.experiment.id)
      } else if (userExperimentCurrent) {
        experiment = experiments.find((e) => e.id === userExperimentCurrent.experiment.id)
      }

      if (experiment)
        return (
          experiment.commands.filter((command) => command !== 'start' && command !== 'stop') || []
        )

      return selectedExperiment?.commands || []
    },
    [experiments, userExperimentCurrent, selectedExperiment],
  )

  const setupSettings = useCallback(
    (userExperiment?: UserExperimentDashboardFragment) => {
      const experiment = userExperiment ? experiments?.find(
        (experiment) => experiment.id === userExperiment.experiment.id,
      ) : selectedExperiment ? selectedExperiment : experiments[0]

      setSelectedExperiment(experiment)

      const commands = getCommands(userExperiment)
      setSelectedCommand(commands[0] || undefined)

      const schema = userExperiment ? userExperiment.schema : undefined
      const demo = userExperiment ? userExperiment.demo : undefined
      
      if (schema) setSelectedSchema(schema)
      if (demo) setSelectedDemo(demo)
    },
    [experiments, getCommands, selectedExperiment, schemaData?.schemas, demoData?.demos],
  )

  const getExperimentInput = useCallback(() => {
    return (
      selectedExperiment?.experiment_commands
        .find((command) => command?.name === selectedCommand)
        ?.arguments.map((arg) => {
          return {
            name: arg?.name as string,
            value: arg?.default_value || '',
          }
        }) || []
    )
  }, [selectedExperiment, selectedCommand])

  const getSchemaInput = useCallback(() => {
    return (
      selectedSchema?.arguments.map((arg) => {
        return {
          name: arg?.name as string,
          value: arg?.default_value?.toString() || '',
        }
      }) || []
    )
  }, [selectedSchema])

  useEffect(() => {
    setupSettings(userExperimentCurrent)
  }, [userExperimentCurrent, setupSettings])

  const replaceExperimentInput = useCallback(() => {
    if (selectedCommand !== 'start' || hasError) {
      setExperimentInput((oldInput) => [...getExperimentInput(), ...getSchemaInput()].map((input) => {
        return {
          ...input,
          value: oldInput.find(old => old.name === input.name)?.value ?? input.value
        }
      }))
    } else {
      setExperimentInput([...getExperimentInput(), ...getSchemaInput()])
    }
  }, [getExperimentInput, getSchemaInput, selectedCommand, hasError])

  useEffect(() => {
    if (!selectedExperiment?.has_schema){
      setSelectedSchema(undefined);
    }
    replaceExperimentInput()
  }, [selectedExperiment, selectedSchema, replaceExperimentInput])

  useEffect(() => {
    if (!selectedExperiment?.has_demo){
      setSelectedDemo(undefined);
    }
    replaceExperimentInput()
  }, [selectedExperiment, selectedSchema, replaceExperimentInput])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()

    if (
      !selectedCommand ||
      !experimentInput ||
      !selectedExperiment ||
      (selectedExperiment?.has_schema && !selectedSchema)
    ) {
      return
    }

    handleSubmitForm({
      experimentId: selectedExperiment.id,
      schemaId: selectedSchema?.id,
      demoId: selectedDemo?.id,
      softwareId: selectedExperiment.software.id,
      command: selectedCommand,
      experimentInput: experimentInput,
    })
  }

  const upsertArgument = useCallback((argument: UserExperimentArgInput) => {
    setExperimentInput((experimentInput) => {
      const i = experimentInput.findIndex((arg) => arg.name === argument.name)
      if (i > -1) experimentInput[i] = argument
      else experimentInput = [...experimentInput, argument]

      return experimentInput
    })
  }, [])

  const getArguments = (args: ArgumentBasic[]) => {
    const formatted = formatArguments(args)

    let rows: React.ReactNode[] = []

    if (selectedExperiment?.deviceType.name.includes("L3Dcube")) {
      let cols: React.ReactNode[] = []

      
      if(selectedInputType === "demo"){
          cols = [
            <CCol key={1}>
                <CFormLabel className="d-block">{t('experiments.columns.demo')}</CFormLabel>
                <div className="d-flex mb-3">
                  <CFormSelect
                    aria-label="demo"
                    id="demo"
                    required={true}
                    disabled={!!userExperimentCurrent}
                    value={selectedDemo?.id}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      setSelectedDemo(demos?.find((demo) => demo.id === event.target.value))
                    }}
                  >
                    <option value={undefined}></option>
                    {demos?.map((demo: ExperimentDemoFragment) => (
                      <option value={demo.id} key={demo.id}>
                        {demo.name}
                      </option>
                    ))}
                  </CFormSelect>

                  {selectedDemo?.visible_preview && 
                    <CButton
                    color="warning"
                    className="ms-2 d-inline-flex justify-content-center align-items-center"
                    onClick={() => {
                      selectedDemo?.demo
                        ? setVisiblePreview(true)
                        : toast.error(t('demos.preview.error'))
                    }}
                    >
                      <CIcon content={cilCode} />
                    </CButton>
                  }
                </div>
          </CCol>,

        ]    
        rows = [
          rows,
          <CRow className="align-items-end" key={1}>
            {cols}
          </CRow>,
        ]    
      }
      
      
      const dict: { [key: string]: string } = { code: "textarea", file: "file" };
      const argument = findArgumentWithType(formatted, dict[selectedInputType]);

      if (argument !== null) {
        cols = [
          <CCol key={1}>
            <ExperimentFormArgument
              argument={argument}
              val={experimentInput.find((arg) => arg.name === argument.name)?.value}
              handleChange={upsertArgument}
              className="mb-3"
              style={{ minWidth: '150px', maxWidth: '100%' }}
            />
          </CCol>,
        ];

        rows = [
          rows,
          <CRow className="align-items-end" key={1}>
            {cols}
          </CRow>,
        ]
      }
    } else {
    Object.values(formatted).forEach((val: ArgumentBasic[], rowIndex: number) => {
      let cols: React.ReactNode[] = []
      val.forEach((argument: ArgumentBasic, colIndex: number) => {            
        cols = [
          ...cols,
          <CCol key={colIndex}>
            <ExperimentFormArgument
              argument={argument}
              val={experimentInput.find((arg) => arg.name === argument.name)?.value}
              handleChange={upsertArgument}
              className="mb-3"
              style={{ minWidth: '150px', maxWidth: '100%' }}
            />
          </CCol>,
        ]
      })

      rows = [
        ...rows,
        <CRow className="align-items-end" key={rowIndex}>
          {cols}
        </CRow>,
      ]
    })}

    return rows
  }

  function findArgumentWithType(data: ArgumentsRow, type: string): ArgumentBasic | null {
    let result: ArgumentBasic | null = null;
  
    Object.values(data).some((group: ArgumentBasic[]) => { 
      const found = group.find(item => item.type === type);
      if (found) {
        result = found;
        return true; // Exit the loop once found
      }
      return false; // Continue if not found
    });
  
    return result;
  }
  

  const schemas = schemaData?.schemas
  const demos = demoData?.demos
  
  return (
    <>
      {selectedSchema?.preview && (
        <ModalPreview
          active={visiblePreview}
          src={selectedSchema.preview}
          handleDismiss={() => setVisiblePreview(false)}
        />
      )}

      {selectedDemo?.demo && (
        <DemoPreview
          active={visiblePreview}
          src={selectedDemo.demo}
          handleDismiss={() => setVisiblePreview(false)}
        />
      )}

      <CForm
          className={"pb-2"}
          onSubmit={handleSubmit}>
        {schemaLoading && <SpinnerOverlay transparent={true} />}
        {schemaError && <ErrorNotifier error={schemaError} />}
        {demoLoading && <SpinnerOverlay transparent={true} />}
        {demoError && <ErrorNotifier error={demoError} />}
        <CRow>
          <CCol style={{flex: "1 0"}}>
            <CFormLabel className="d-block">{t('experiments.columns.experiment')}</CFormLabel>
            <CFormSelect
              aria-label="experiment"
              id="experiment"
              className="mb-3"
              disabled={!!userExperimentCurrent}
              value={selectedExperiment?.id}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                const experiment = experiments?.find(
                  (experiment) => experiment.id === event.target.value,
                )
                setSelectedDemo(undefined)
                setSelectedExperiment(experiment)
                setSelectedCommand(experiment?.commands[0] || undefined)
              }}
            >
              {experiments.map((experiment) => (
                <option value={experiment.id} key={experiment.id}>
                  {experiment.name}
                </option>
              ))}
            </CFormSelect>

            {selectedExperiment?.has_schema && (
              <>
                <CFormLabel className="d-block">{t('experiments.columns.schema')}</CFormLabel>
                <div className="d-flex mb-3">
                  <CFormSelect
                    aria-label="schema"
                    id="schema"
                    required={true}
                    disabled={!!userExperimentCurrent}
                    value={selectedSchema?.id}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      setSelectedSchema(schemas?.find((schema) => schema.id === event.target.value))
                    }}
                  >
                    <option value={undefined}></option>
                    {schemas?.map((schema: ExperimentSchemaFragment) => (
                      <option value={schema.id} key={schema.id}>
                        {schema.name}
                      </option>
                    ))}
                  </CFormSelect>

                  <CButton
                    color="warning"
                    className="ms-2 d-inline-flex justify-content-center align-items-center"
                    onClick={() => {
                      selectedSchema?.preview
                        ? setVisiblePreview(true)
                        : toast.error(t('schemas.preview.error'))
                    }}
                  >
                    <CIcon content={cilImage} />
                  </CButton>
                </div>
              </>
            )}

            {selectedExperiment?.deviceType.name.includes("L3Dcube") && (
              <>
                <CFormLabel className="d-block">{t('experiments.columns.input_type')}</CFormLabel>
                <div className="d-flex mb-3">
                  <CFormSelect
                    aria-label="demo"
                    id="demo"
                    required={true}
                    disabled={!!userExperimentCurrent}
                    value={selectedInputType}
                    onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                      setSelectedDemo(undefined)
                      setSelectedInputType(event.target.value)   /* tuto* */
                    }}
                  >
                    {/* <option value={undefined}></option> */}
                    {inputTypes?.map((it: string) => (
                      <option value={it} key={it}>
                        {it}
                      </option>
                    ))}
                  </CFormSelect>
                </div>  
              </>
            )}
          </CCol>

          <CCol style={{flex: "2 0"}}>
            <CFormLabel className="d-block">{t('experiments.columns.command')}</CFormLabel>
            <CFormSelect
              aria-label="command"
              id="command"
              className="mb-3"
              disabled={disableCommandSelect}
              value={selectedCommand || undefined}
              onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                setSelectedCommand(event.target.value)
              }}
            >
              {getCommands().map((command) => (
                <option value={command as string} key={command}>
                  {command}
                </option>
              ))}
            </CFormSelect>
            {selectedCommand && selectedExperiment?.experiment_commands && getArguments((selectedExperiment?.experiment_commands
              .find((command) => command?.name === selectedCommand)?.arguments || []))}
            {selectedSchema?.arguments && getArguments(selectedSchema?.arguments)}
          </CCol>
        </CRow>
        <div className="text-right">
          {handleStop && selectedExperiment?.commands.includes('stop') && (
            <CButton
              type="button"
              className="d-inline-flex justify-content-center align-items-center text-light me-2"
              color="danger"
              onClick={handleStop}
            >
              {t('experiments.actions.stop.btn')}
            </CButton>
          )}
          <CButton
            type="submit"
            className="d-inline-flex justify-content-center align-items-center"
            color="primary"
            // disabled={disabled}
            disabled={false}
          >
            {submitBtnText ? submitBtnText : t('experiments.actions.run.btn')}
          </CButton>
        </div>
      </CForm>
    </>
  )
}

export default ExperimentForm
