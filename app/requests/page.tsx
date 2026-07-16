"use client"

import { useState } from "react"
import { Controller, useForm, useWatch } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { CheckIcon, ChevronsUpDownIcon, XIcon } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Mirrors BE §0 validation limits (docs/BACKEND_API_GUIDE.md) even though this
// form isn't wired to the real API yet — see MOCK_APPROVERS below.
const SCRIPT_EXTENSIONS = ["py", "js", "sh"] as const
const MAX_SCRIPT_FILE_BYTES = 5 * 1024 * 1024

const REQUEST_STATUS_OPTIONS = [
  { value: "DRAFT", label: "Draft" },
  { value: "PENDING_APPROVAL", label: "Pending Approval" },
] as const

// Stands in for `GET /api/users?role=APPROVER` until this page is wired to the backend.
const MOCK_APPROVERS = [
  { id: 3, name: "Carol Approver" },
  { id: 4, name: "Dan Approver" },
  { id: 5, name: "Eve Lead" },
]

function fileExtension(filename: string) {
  return filename.split(".").pop()?.toLowerCase() ?? ""
}

const requestFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(150, "Keep it under 150 characters"),
    title: z.string().trim().min(1, "Title is required").max(150, "Keep it under 150 characters"),
    file: z
      .instanceof(File, { message: "Attach a script file" })
      .refine((file) => file.size > 0, "The file is empty")
      .refine((file) => file.size <= MAX_SCRIPT_FILE_BYTES, "File must be 5MB or smaller")
      .refine(
        (file) =>
          (SCRIPT_EXTENSIONS as readonly string[]).includes(fileExtension(file.name)),
        "Only .py, .js, or .sh files are allowed"
      ),
    restrictToApprovers: z.boolean(),
    approverIds: z.array(z.number()),
    status: z.enum(["DRAFT", "PENDING_APPROVAL"]),
  })
  .refine((data) => !data.restrictToApprovers || data.approverIds.length > 0, {
    message: "Select at least one approver",
    path: ["approverIds"],
  })

type RequestFormValues = z.infer<typeof requestFormSchema>

interface SubmittedRequest extends Omit<RequestFormValues, "file"> {
  id: number
  fileName: string
  submittedAt: string
}

const DEFAULT_VALUES = {
  name: "",
  title: "",
  restrictToApprovers: false,
  approverIds: [] as number[],
  status: "DRAFT" as const,
}

export default function RequestsPage() {
  const [submitted, setSubmitted] = useState<SubmittedRequest[]>([])
  const [fileInputKey, setFileInputKey] = useState(0)

  const form = useForm<RequestFormValues>({
    resolver: zodResolver(requestFormSchema),
    defaultValues: DEFAULT_VALUES,
  })

  const restrictToApprovers = useWatch({
    control: form.control,
    name: "restrictToApprovers",
  })

  function onSubmit(values: RequestFormValues) {
    // No backend wired up yet (mock data only) — this just appends to an
    // in-memory list as a stand-in for `POST /api/releases/{releaseId}/requests`.
    setSubmitted((prev) => [
      {
        id: Date.now(),
        name: values.name,
        title: values.title,
        restrictToApprovers: values.restrictToApprovers,
        approverIds: values.approverIds,
        status: values.status,
        fileName: values.file.name,
        submittedAt: new Date().toLocaleString(),
      },
      ...prev,
    ])
    form.reset(DEFAULT_VALUES)
    setFileInputKey((key) => key + 1)
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-xl font-semibold">New deployment request</h1>
        <p className="text-sm text-muted-foreground">
          Attach the script that should run once this release is finalized.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Request details</CardTitle>
          <CardDescription>
            Mock form for now — not yet connected to the backend.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5">
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                placeholder="e.g. Nightly DB migration"
                aria-invalid={!!form.formState.errors.name}
                {...form.register("name")}
              />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Short summary for the approval queue"
                aria-invalid={!!form.formState.errors.title}
                {...form.register("title")}
              />
              {form.formState.errors.title && (
                <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
              )}
            </div>

            <div className="flex flex-col gap-2" key={fileInputKey}>
              <Label htmlFor="file">Script file</Label>
              <Controller
                control={form.control}
                name="file"
                render={({ field: { onChange, onBlur, ref, name } }) => (
                  <Input
                    id="file"
                    type="file"
                    name={name}
                    ref={ref}
                    onBlur={onBlur}
                    accept=".py,.js,.sh"
                    aria-invalid={!!form.formState.errors.file}
                    onChange={(e) => onChange(e.target.files?.[0])}
                  />
                )}
              />
              <p className="text-xs text-muted-foreground">.py, .js or .sh, up to 5MB.</p>
              {form.formState.errors.file && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.file.message as string}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-xl border border-input bg-input/10 p-4">
              <div className="flex items-center gap-2">
                <Controller
                  control={form.control}
                  name="restrictToApprovers"
                  render={({ field: { value, onChange } }) => (
                    <Checkbox
                      id="restrictToApprovers"
                      checked={value}
                      onCheckedChange={(checked) => {
                        onChange(checked === true)
                        if (!checked) form.setValue("approverIds", [])
                      }}
                    />
                  )}
                />
                <Label htmlFor="restrictToApprovers" className="font-normal">
                  Restrict review to specific approver(s)
                </Label>
              </div>

              {restrictToApprovers && (
                <div className="flex flex-col gap-2">
                  <Controller
                    control={form.control}
                    name="approverIds"
                    render={({ field: { value, onChange } }) => (
                      <ApproverMultiSelect options={MOCK_APPROVERS} value={value} onChange={onChange} />
                    )}
                  />
                  {form.formState.errors.approverIds && (
                    <p className="text-xs text-destructive">
                      {form.formState.errors.approverIds.message}
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="status">Status</Label>
              <Controller
                control={form.control}
                name="status"
                render={({ field: { value, onChange } }) => (
                  <Select value={value} onValueChange={onChange}>
                    <SelectTrigger id="status" className="w-full">
                      <SelectValue placeholder="Select a status" />
                    </SelectTrigger>
                    <SelectContent>
                      {REQUEST_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <Button type="submit" disabled={form.formState.isSubmitting} className="self-start">
              Create request
            </Button>
          </form>
        </CardContent>
      </Card>

      {submitted.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-medium text-muted-foreground">
            Submitted this session ({submitted.length})
          </h2>
          {submitted.map((request) => (
            <Card key={request.id} size="sm">
              <CardContent className="flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{request.title}</span>
                  <Badge variant={request.status === "DRAFT" ? "secondary" : "default"}>
                    {REQUEST_STATUS_OPTIONS.find((o) => o.value === request.status)?.label}
                  </Badge>
                </div>
                <span className="text-xs text-muted-foreground">{request.name}</span>
                <span className="text-xs text-muted-foreground">
                  {request.fileName}
                  {request.restrictToApprovers &&
                    ` · restricted to ${request.approverIds
                      .map((id) => MOCK_APPROVERS.find((a) => a.id === id)?.name)
                      .filter(Boolean)
                      .join(", ")}`}
                </span>
                <span className="text-[11px] text-muted-foreground">{request.submittedAt}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

interface ApproverMultiSelectProps {
  options: { id: number; name: string }[]
  value: number[]
  onChange: (value: number[]) => void
}

function ApproverMultiSelect({ options, value, onChange }: ApproverMultiSelectProps) {
  const [open, setOpen] = useState(false)

  function toggle(id: number) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id])
  }

  const selected = options.filter((option) => value.includes(option.id))

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button type="button" variant="outline" className="w-full justify-between font-normal">
            <span className="flex flex-1 flex-wrap items-center gap-1 text-left">
              {selected.length === 0 ? (
                <span className="text-muted-foreground">Select approvers...</span>
              ) : (
                selected.map((approver) => (
                  <Badge key={approver.id} variant="secondary" className="gap-1">
                    {approver.name}
                    <span
                      role="button"
                      tabIndex={-1}
                      className="cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation()
                        toggle(approver.id)
                      }}
                    >
                      <XIcon className="size-3" />
                    </span>
                  </Badge>
                ))
              )}
            </span>
            <ChevronsUpDownIcon className="size-4 shrink-0 opacity-50" />
          </Button>
        }
      />
      <PopoverContent className="w-(--anchor-width) p-0" align="start">
        <Command>
          <CommandInput placeholder="Search approvers..." />
          <CommandList>
            <CommandEmpty>No approver found.</CommandEmpty>
            <CommandGroup>
              {options.map((option) => (
                <CommandItem key={option.id} value={option.name} onSelect={() => toggle(option.id)}>
                  <CheckIcon
                    className={cn("size-4", value.includes(option.id) ? "opacity-100" : "opacity-0")}
                  />
                  {option.name}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
