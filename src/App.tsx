import { Controller, SubmitHandler, useForm } from "react-hook-form";
import "./App.css";
import { Button, Card, Checkbox, Label, Modal, Progress, Textarea, TextInput } from "flowbite-react";
import { Channel, invoke } from "@tauri-apps/api/core";
import { useState } from "react";
import { HiOutlineExclamationCircle } from "react-icons/hi";
import { save } from "@tauri-apps/plugin-dialog";

type ElectionTemplate = {
  name: string;
  start: number;
  end: number;
  question: string;
  choices: string;
  signature_required: boolean;
}

type ElectionData = {
  seed: string;
  election: any;
}

function App() {
  const [progress, setProgress] = useState<number | undefined>()
  const [seed, setSeed] = useState<string>("")
  const [election, setElection] = useState<any>()
  const [showSeed, setShowSeed] = useState(false)
  const { register, control, handleSubmit, formState: { errors } } = useForm<ElectionTemplate>({
    defaultValues: {
      name: "",
      start: 2100000,
      end: 2100100,
      question: "",
      choices: "",
      signature_required: false,
    }
  })
  const onSubmit: SubmitHandler<ElectionTemplate> = (data) => {
    (async () => {
      const channel = new Channel<number>()
      channel.onmessage = (p) => {
        setProgress(p);
      }

      const election: string = await invoke("create_election", { election: data, channel: channel, })
      const electionData: ElectionData = JSON.parse(election)
      const seed = electionData.seed

      setSeed(seed)
      setElection(electionData.election)
      setShowSeed(true)
    })()
  }

  const saveElectionFile = () => {
    (async () => {
      setShowSeed(false)
      const path = await save({
        defaultPath: election.id,
        title: 'Save Election File',
        filters: [{
          name: 'Election',
          extensions: ['json']
        }]
      })
      await invoke("save_election", { path: path, election: election })
    })()
  }

  return (
    <main>
      <Card className="max-w-full h-screen">
        <form onSubmit={handleSubmit(onSubmit)}>
          <h2 className="text-xl font-extrabold">Create an Election/Vote</h2>
          <Label htmlFor="name">Name</Label>
          <Controller control={control}
            name="name"
            render={({ field }) =>
              <TextInput
                {...field}
                placeholder="Best Crypto"
                color={errors.name && "failure"}
                required
                helperText={<span className="font-medium">{errors.name?.message}</span>}
              />}
          />

          <div className="flex w-full gap-4">
            <div className="flex flex-col">
              <Label htmlFor="start">Registration Start</Label>
              <Controller control={control}
                name="start"
                render={({ field }) =>
                  <TextInput
                    {...field}
                    type="number"
                    color={errors.start && "failure"}
                    onChange={(v) => field.onChange(v.target.valueAsNumber)}
                    required
                    helperText={<span className="font-medium">{errors.start?.message}</span>}
                  />}
              />
            </div>

            <div className="flex flex-col">
              <Label htmlFor="end">Start of Voting</Label>
              <Controller control={control}
                name="end"
                render={({ field }) =>
                  <TextInput
                    {...field}
                    type="number"
                    color={errors.end && "failure"}
                    onChange={(v) => field.onChange(v.target.valueAsNumber)}
                    required
                    helperText={<span className="font-medium">{errors.end?.message}</span>}
                  />}
              />
            </div>
          </div>

          <Label htmlFor="question">Ballot Question</Label>
          <Controller control={control}
            name="question"
            render={({ field }) =>
              <TextInput
                {...field}
                color={errors.question && "failure"}
                placeholder="What is the best cryptocurrency?"
                required
                helperText={<span className="font-medium">{errors.question?.message}</span>}
              />}
          />

          <Label htmlFor="choices">Ballot Choices</Label>
          <Controller control={control}
            name="choices"
            render={({ field }) =>
              <Textarea rows={10}
                {...field}
                color={errors.choices && "failure"}
                placeholder="Use one line per choice"
                required
                helperText={<span className="font-medium">{errors.choices?.message}</span>}
              />}
          />
          <div className="flex items-center gap-2">
            <Checkbox id="signature_required" defaultChecked {...register("signature_required")} />
            <Label htmlFor="signature_required" className="flex">
              Signature Required
            </Label>
          </div>
          <Button className="my-4" onClick={() => { }} type="submit">
            Create Election File</Button>
          {progress && <Progress progress={progress} />}
        </form>
      </Card>
      <Modal show={showSeed}>
        <Modal.Header>Election Seed</Modal.Header>
        <Modal.Body>
          <div className="text-center">
            <HiOutlineExclamationCircle className="mx-auto mb-4 h-14 w-14 text-gray-400 dark:text-gray-200" />
            <h3 className="mb-5 text-md font-normal text-gray-500 dark:text-gray-400">
              You must save these 24 words in the correct order and spelling.
              It is impossible to decode the votes without them.
            </h3>
            <h4 className="text-lg mb-4 border border-red-400">{seed}</h4>
            <div className="flex justify-center gap-4">
              <Button onClick={saveElectionFile}>
                OK, I have saved them
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </main>
  );
}

export default App;
