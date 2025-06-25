"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { ChevronLeft, ChevronRight, Settings, Palette } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { WeekView } from "./week-view"
import { MonthView } from "./month-view"
import { DayView } from "./day-view"
import { AppointmentModal } from "./appointment-modal"

export interface Appointment {
  id: string
  title: string
  provider: string
  facility: string
  startTime: Date
  endTime: Date
  type: string
  color: string
}

interface FacilityGroup {
  id: string
  name: string
  facilities: string[]
  color?: string
}

interface SchedulingDashboardProps {
  appointments: Appointment[]
  facilities: string[]
  facilityGroups?: FacilityGroup[]
}

export function SchedulingDashboard({ appointments, facilities, facilityGroups }: SchedulingDashboardProps) {
  const [currentDate, setCurrentDate] = useState(new Date(2025, 5, 23)) // June 23, 2025
  const [view, setView] = useState<"day" | "week" | "month">("week")
  const [selectedProvider, setSelectedProvider] = useState<string>("")
  const [selectedProviderType, setSelectedProviderType] = useState<string>("")
  const [selectedFacility, setSelectedFacility] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [currentAppointments, setCurrentAppointments] = useState(appointments)
  const [currentFacilityGroups, setCurrentFacilityGroups] = useState<FacilityGroup[]>(facilityGroups || [])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalAppointment, setModalAppointment] = useState<Appointment | null>(null)
  const [timeScale, setTimeScale] = useState(6) // 6-hour intervals
  const [timeOffset, setTimeOffset] = useState(0) // Starting hour offset

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "n" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault()
        handleCreateAppointment()
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [])

  const handleAppointmentUpdate = useCallback(
    (appointmentId: string, newStartTime: Date, newEndTime: Date, newFacility: string) => {
      setCurrentAppointments((prev) =>
        prev.map((apt) =>
          apt.id === appointmentId
            ? { ...apt, startTime: newStartTime, endTime: newEndTime, facility: newFacility }
            : apt,
        ),
      )
    },
    [],
  )

  const handleFacilityGroupReorder = useCallback((newOrder: FacilityGroup[]) => {
    setCurrentFacilityGroups(newOrder)
    console.log("New facility group order:", newOrder)
  }, [])

  const navigateDate = (direction: "prev" | "next") => {
    const newDate = new Date(currentDate)
    if (view === "day") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 1 : -1))
    } else if (view === "week") {
      newDate.setDate(newDate.getDate() + (direction === "next" ? 7 : -7))
    } else {
      newDate.setMonth(newDate.getMonth() + (direction === "next" ? 1 : -1))
    }
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const handleCreateAppointment = () => {
    setModalAppointment(null)
    setIsModalOpen(true)
  }

  const handleEditAppointment = (appointment: Appointment) => {
    setModalAppointment(appointment)
    setIsModalOpen(true)
  }

  const handleDeleteAppointment = (appointmentId: string) => {
    setCurrentAppointments((prev) => prev.filter((apt) => apt.id !== appointmentId))
  }

  const handleSaveAppointment = (appointmentData: Partial<Appointment>) => {
    if (modalAppointment) {
      // Update existing appointment
      setCurrentAppointments((prev) =>
        prev.map((apt) => (apt.id === modalAppointment.id ? { ...apt, ...appointmentData } : apt)),
      )
    } else {
      // Create new appointment
      const newAppointment: Appointment = {
        id: `new-${Date.now()}`,
        title: appointmentData.title || "",
        provider: appointmentData.provider || "",
        facility: appointmentData.facility || "",
        startTime: appointmentData.startTime || new Date(),
        endTime: appointmentData.endTime || new Date(),
        type: appointmentData.type || "",
        color: appointmentData.color || "bg-blue-400",
      }
      setCurrentAppointments((prev) => [...prev, newAppointment])
    }
    setIsModalOpen(false)
  }

  const handleTimeScaleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault()
      const delta = e.deltaY > 0 ? 1 : -1
      setTimeScale((prev) => Math.max(1, Math.min(12, prev + delta)))
    } else if (e.shiftKey) {
      // Handle horizontal scrolling for time navigation
      e.preventDefault()
      const delta = e.deltaY > 0 ? 2 : -2
      setTimeOffset((prev) => Math.max(0, Math.min(22, prev + delta)))
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <div className="border-b bg-white px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-semibold text-blue-600">Scheduling Dashboard</h1>
            <p className="text-sm text-gray-600">List of all the schedules / availability of providers</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-blue-600">
              <Settings className="w-4 h-4 mr-1" />
              Notification Settings
            </Button>
            <Button variant="ghost" size="sm" className="text-blue-600">
              <Palette className="w-4 h-4 mr-1" />
              Color Code
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-4">
          <Select value={selectedProvider} onValueChange={setSelectedProvider}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Providers</SelectItem>
              <SelectItem value="dr-smith">Dr. Smith</SelectItem>
              <SelectItem value="jeswin-3">jeswin-3</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedProviderType} onValueChange={setSelectedProviderType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select Provider Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="doctor">Doctor</SelectItem>
              <SelectItem value="technician">Technician</SelectItem>
            </SelectContent>
          </Select>

          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Facility" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Facilities</SelectItem>
              {facilities.map((facility) => (
                <SelectItem key={facility} value={facility}>
                  {facility}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedStatus} onValueChange={setSelectedStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="busy">Busy</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex-1" />

          <div className="flex gap-2">
            <Button onClick={handleCreateAppointment} className="bg-blue-600 hover:bg-blue-700">
              Add Provider Availability
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Provider Schedule</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Facility Schedule</Button>
            <Button className="bg-blue-600 hover:bg-blue-700">Schedule</Button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button onClick={goToToday} className="bg-blue-600 hover:bg-blue-700">
              Today
            </Button>

            <div className="flex items-center gap-2">
              <Select
                value={currentDate.getMonth().toString()}
                onValueChange={(value) => {
                  const newDate = new Date(currentDate)
                  newDate.setMonth(Number.parseInt(value))
                  setCurrentDate(newDate)
                }}
              >
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[
                    "January",
                    "February",
                    "March",
                    "April",
                    "May",
                    "June",
                    "July",
                    "August",
                    "September",
                    "October",
                    "November",
                    "December",
                  ].map((month, index) => (
                    <SelectItem key={month} value={index.toString()}>
                      {month}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={currentDate.getFullYear().toString()}
                onValueChange={(value) => {
                  const newDate = new Date(currentDate)
                  newDate.setFullYear(Number.parseInt(value))
                  setCurrentDate(newDate)
                }}
              >
                <SelectTrigger className="w-24">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="sm" onClick={() => navigateDate("prev")}>
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigateDate("next")}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>

          <div className="flex gap-1 bg-blue-600 rounded-md p-1">
            <Button
              variant={view === "day" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("day")}
              className={view === "day" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500"}
            >
              Day
            </Button>
            <Button
              variant={view === "week" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("week")}
              className={view === "week" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500"}
            >
              Week
            </Button>
            <Button
              variant={view === "month" ? "secondary" : "ghost"}
              size="sm"
              onClick={() => setView("month")}
              className={view === "month" ? "bg-white text-blue-600" : "text-white hover:bg-blue-500"}
            >
              Month
            </Button>
          </div>
        </div>
      </div>

      {/* Calendar Content */}
      <div className="flex-1 overflow-hidden">
        {view === "day" && (
          <DayView
            currentDate={currentDate}
            appointments={currentAppointments}
            facilities={facilities}
            onAppointmentUpdate={handleAppointmentUpdate}
            onEditAppointment={handleEditAppointment}
            timeScale={timeScale}
            timeOffset={timeOffset}
            onTimeScaleWheel={handleTimeScaleWheel}
          />
        )}
        {view === "week" && (
          <WeekView
            currentDate={currentDate}
            appointments={currentAppointments}
            facilities={facilities}
            facilityGroups={currentFacilityGroups}
            onAppointmentUpdate={handleAppointmentUpdate}
            onFacilityGroupReorder={handleFacilityGroupReorder}
            onEditAppointment={handleEditAppointment}
            timeScale={timeScale}
            timeOffset={timeOffset}
            onTimeScaleWheel={handleTimeScaleWheel}
          />
        )}
        {view === "month" && (
          <MonthView currentDate={currentDate} appointments={currentAppointments} facilities={facilities} />
        )}
      </div>
      <AppointmentModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        appointment={modalAppointment}
        facilities={facilities}
        onSave={handleSaveAppointment}
        onDelete={modalAppointment ? () => handleDeleteAppointment(modalAppointment.id) : undefined}
      />
    </div>
  )
}
