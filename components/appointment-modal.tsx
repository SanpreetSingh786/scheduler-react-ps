"use client"

import { useState, useEffect } from "react"
import { Calendar, X } from "lucide-react"
import { format } from "date-fns"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import type { Appointment } from "./scheduling-dashboard"

interface AppointmentModalProps {
  isOpen: boolean
  onClose: () => void
  appointment?: Appointment | null
  facilities: string[]
  onSave: (appointmentData: Partial<Appointment>) => void
  onDelete?: () => void
}

const appointmentTypes = [
  { value: "X-Ray Tech", color: "bg-green-400" },
  { value: "MA", color: "bg-orange-400" },
  { value: "Doctor", color: "bg-blue-400" },
  { value: "Emergency", color: "bg-red-500" },
  { value: "Consultation", color: "bg-purple-400" },
  { value: "Surgery", color: "bg-indigo-400" },
]

// Generate time options for dropdowns
const generateTimeOptions = () => {
  const times = []
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeString = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`
      const displayTime = new Date(2000, 0, 1, hour, minute).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
      times.push({ value: timeString, label: displayTime })
    }
  }
  return times
}

export function AppointmentModal({
  isOpen,
  onClose,
  appointment,
  facilities,
  onSave,
  onDelete,
}: AppointmentModalProps) {
  const [title, setTitle] = useState("")
  const [provider, setProvider] = useState("")
  const [facility, setFacility] = useState("")
  const [startDate, setStartDate] = useState<Date | undefined>(new Date())
  const [endDate, setEndDate] = useState<Date | undefined>(new Date())
  const [startTime, setStartTime] = useState("09:00")
  const [endTime, setEndTime] = useState("17:00")
  const [type, setType] = useState("")
  const [color, setColor] = useState("bg-blue-400")

  const timeOptions = generateTimeOptions()

  // Pre-populate form when editing an appointment
  useEffect(() => {
    if (appointment) {
      setTitle(appointment.title)
      setProvider(appointment.provider)
      setFacility(appointment.facility)
      setType(appointment.type)
      setColor(appointment.color)

      const start = new Date(appointment.startTime)
      const end = new Date(appointment.endTime)

      setStartDate(start)
      setEndDate(end)
      setStartTime(format(start, "HH:mm"))
      setEndTime(format(end, "HH:mm"))
    } else {
      // Reset form for new appointment
      setTitle("")
      setProvider("")
      setFacility("")
      setStartDate(new Date())
      setEndDate(new Date())
      setStartTime("09:00")
      setEndTime("17:00")
      setType("")
      setColor("bg-blue-400")
    }
  }, [appointment, isOpen])

  const handleSave = () => {
    if (!startDate || !endDate) return

    const [startHour, startMinute] = startTime.split(":").map(Number)
    const [endHour, endMinute] = endTime.split(":").map(Number)

    const startDateTime = new Date(startDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(endDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    const appointmentData: Partial<Appointment> = {
      id: appointment?.id || `new-${Date.now()}`,
      title,
      provider,
      facility,
      startTime: startDateTime,
      endTime: endDateTime,
      type,
      color,
    }

    onSave(appointmentData)
    onClose()
  }

  const handleTypeChange = (selectedType: string) => {
    setType(selectedType)
    const typeConfig = appointmentTypes.find((t) => t.value === selectedType)
    if (typeConfig) {
      setColor(typeConfig.color)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">
              {appointment ? "Edit Appointment" : "Create New Appointment"}
            </DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {appointment ? "Update the appointment details below." : "Fill in the details to create a new appointment."}
          </p>
        </DialogHeader>

        <div className="px-6 py-4 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title" className="text-sm font-medium">
              Title
            </Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Appointment title"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="provider" className="text-sm font-medium">
              Provider
            </Label>
            <Input
              id="provider"
              value={provider}
              onChange={(e) => setProvider(e.target.value)}
              placeholder="Provider name"
              className="w-full"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="facility" className="text-sm font-medium">
              Facility
            </Label>
            <Select value={facility} onValueChange={setFacility}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select facility" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((f) => (
                  <SelectItem key={f} value={f}>
                    {f}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium">
              Type
            </Label>
            <Select value={type} onValueChange={handleTypeChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select appointment type" />
              </SelectTrigger>
              <SelectContent>
                {appointmentTypes.map((t) => (
                  <SelectItem key={t.value} value={t.value}>
                    <div className="flex items-center gap-2">
                      <div className={`w-3 h-3 rounded-full ${t.color}`} />
                      {t.value}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {startDate ? format(startDate, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={startDate} onSelect={setStartDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startTime" className="text-sm font-medium">
                Start Time
              </Label>
              <Select value={startTime} onValueChange={setStartTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-sm font-medium">End Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal">
                    <Calendar className="mr-2 h-4 w-4" />
                    {endDate ? format(endDate, "MMM dd, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent mode="single" selected={endDate} onSelect={setEndDate} initialFocus />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endTime" className="text-sm font-medium">
                End Time
              </Label>
              <Select value={endTime} onValueChange={setEndTime}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select time" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {timeOptions.map((time) => (
                    <SelectItem key={time.value} value={time.value}>
                      {time.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between px-6 py-4 border-t bg-gray-50">
          <div>
            {appointment && onDelete && (
              <Button
                variant="destructive"
                onClick={() => {
                  onDelete()
                  onClose()
                }}
                className="bg-red-500 hover:bg-red-600"
              >
                Delete
              </Button>
            )}
          </div>
          <div className="flex gap-3">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-gray-800 hover:bg-gray-900 text-white">
              {appointment ? "Update Appointment" : "Create Appointment"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
