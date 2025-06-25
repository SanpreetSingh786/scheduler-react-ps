"use client"

import { useMemo, useState, useCallback } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X } from "lucide-react"
import type { Appointment } from "./scheduling-dashboard"

interface MonthViewProps {
  currentDate: Date
  appointments: Appointment[]
  facilities: string[]
}

interface EventOverflowModalProps {
  isOpen: boolean
  onClose: () => void
  date: Date
  appointments: Appointment[]
}

function EventOverflowModal({ isOpen, onClose, date, appointments }: EventOverflowModalProps) {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    })
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-lg font-semibold">Events for {formatDate(date)}</DialogTitle>
            <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {appointments.map((appointment) => (
            <div key={appointment.id} className={`p-3 rounded-lg ${appointment.color} text-white`}>
              <div className="font-semibold">{appointment.title}</div>
              <div className="text-sm opacity-90">
                {formatTime(new Date(appointment.startTime))} - {formatTime(new Date(appointment.endTime))}
              </div>
              <div className="text-sm opacity-80">{appointment.facility}</div>
              <div className="text-sm opacity-80">{appointment.provider}</div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export function MonthView({ currentDate, appointments, facilities }: MonthViewProps) {
  const [overflowModal, setOverflowModal] = useState<{
    isOpen: boolean
    date: Date
    appointments: Appointment[]
  }>({
    isOpen: false,
    date: new Date(),
    appointments: [],
  })

  const monthData = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()

    // Get first day of month and calculate start of calendar grid
    const firstDay = new Date(year, month, 1)
    const startDate = new Date(firstDay)
    const dayOfWeek = firstDay.getDay()
    // Adjust to start on Monday
    startDate.setDate(firstDay.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1))

    // Generate 42 days (6 weeks) to ensure complete month view
    const days = []
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate)
      date.setDate(startDate.getDate() + i)
      days.push(date)
    }

    return days
  }, [currentDate])

  const getAppointmentsForDate = useCallback(
    (date: Date) => {
      const dayStart = new Date(date)
      dayStart.setHours(0, 0, 0, 0)
      const dayEnd = new Date(date)
      dayEnd.setHours(23, 59, 59, 999)

      return appointments.filter((apt) => {
        const aptStart = new Date(apt.startTime)
        const aptEnd = new Date(apt.endTime)
        return aptStart <= dayEnd && aptEnd >= dayStart
      })
    },
    [appointments],
  )

  const getAppointmentSpanDates = useCallback((appointment: Appointment) => {
    const startDate = new Date(appointment.startTime)
    const endDate = new Date(appointment.endTime)
    const dates = []

    const currentDate = new Date(startDate)
    currentDate.setHours(0, 0, 0, 0)

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }, [])

  const getMultiDayAppointments = useCallback(() => {
    const multiDayAppts = new Map<
      string,
      {
        appointment: Appointment
        startCol: number
        endCol: number
        row: number
        spanDates: Date[]
      }
    >()

    appointments.forEach((appointment) => {
      const spanDates = getAppointmentSpanDates(appointment)
      if (spanDates.length > 1) {
        // Find start and end positions in the month grid
        const startIndex = monthData.findIndex((date) => date.toDateString() === spanDates[0].toDateString())
        const endIndex = monthData.findIndex(
          (date) => date.toDateString() === spanDates[spanDates.length - 1].toDateString(),
        )

        if (startIndex !== -1 && endIndex !== -1) {
          const startCol = startIndex % 7
          const endCol = endIndex % 7
          const startRow = Math.floor(startIndex / 7)
          const endRow = Math.floor(endIndex / 7)

          // Handle multi-row spanning
          if (startRow === endRow) {
            multiDayAppts.set(appointment.id, {
              appointment,
              startCol,
              endCol,
              row: startRow,
              spanDates,
            })
          } else {
            // Split into multiple segments for different rows
            for (let row = startRow; row <= endRow; row++) {
              const segmentStartCol = row === startRow ? startCol : 0
              const segmentEndCol = row === endRow ? endCol : 6

              multiDayAppts.set(`${appointment.id}-row-${row}`, {
                appointment,
                startCol: segmentStartCol,
                endCol: segmentEndCol,
                row,
                spanDates,
              })
            }
          }
        }
      }
    })

    return multiDayAppts
  }, [appointments, monthData, getAppointmentSpanDates])

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth()
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const handleShowMoreEvents = (date: Date, dayAppointments: Appointment[]) => {
    setOverflowModal({
      isOpen: true,
      date,
      appointments: dayAppointments,
    })
  }

  const multiDayAppointments = getMultiDayAppointments()

  return (
    <div className="flex flex-col h-full">
      {/* Days of Week Header */}
      <div className="grid grid-cols-7 border-b bg-gray-50">
        {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
          <div key={day} className="p-3 text-center font-medium text-sm border-r last:border-r-0">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-6 relative">
        {/* Multi-day appointments overlay */}
        {Array.from(multiDayAppointments.values()).map((multiDayAppt, index) => {
          const { appointment, startCol, endCol, row } = multiDayAppt
          const width = endCol - startCol + 1

          return (
            <div
              key={`${appointment.id}-${row}`}
              className={`absolute z-10 ${appointment.color} text-white text-xs px-2 py-1 rounded-sm font-medium shadow-sm`}
              style={{
                left: `${(startCol / 7) * 100}%`,
                top: `${(row / 6) * 100 + 2}%`,
                width: `${(width / 7) * 100}%`,
                height: "20px",
                marginLeft: "2px",
                marginRight: "2px",
              }}
            >
              <div className="truncate">{appointment.title}</div>
            </div>
          )
        })}

        {/* Day cells */}
        {monthData.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date)
          // Filter out multi-day appointments for single-day display
          const singleDayAppointments = dayAppointments.filter((apt) => {
            const spanDates = getAppointmentSpanDates(apt)
            return spanDates.length === 1
          })

          const isCurrentMonthDay = isCurrentMonth(date)
          const isTodayDate = isToday(date)
          const maxVisibleEvents = 3
          const visibleEvents = singleDayAppointments.slice(0, maxVisibleEvents)
          const hiddenEventsCount = singleDayAppointments.length - maxVisibleEvents

          return (
            <div
              key={index}
              className={`border-r border-b last:border-r-0 p-2 min-h-[120px] relative ${
                !isCurrentMonthDay ? "bg-gray-50 text-gray-400" : "bg-white"
              } ${isTodayDate ? "bg-blue-50" : ""}`}
            >
              <div className={`text-sm font-medium mb-2 ${isTodayDate ? "text-blue-600" : ""}`}>{date.getDate()}</div>

              {/* Single day events */}
              <div className="space-y-1 mt-6">
                {visibleEvents.map((appointment) => (
                  <div
                    key={appointment.id}
                    className={`text-xs px-2 py-1 rounded text-white font-medium ${appointment.color} truncate`}
                    title={`${appointment.title} - ${appointment.facility}`}
                  >
                    {appointment.title}
                  </div>
                ))}

                {hiddenEventsCount > 0 && (
                  <button
                    onClick={() => handleShowMoreEvents(date, dayAppointments)}
                    className="text-xs text-blue-600 hover:text-blue-800 font-medium cursor-pointer"
                  >
                    +{hiddenEventsCount} more
                  </button>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <EventOverflowModal
        isOpen={overflowModal.isOpen}
        onClose={() => setOverflowModal((prev) => ({ ...prev, isOpen: false }))}
        date={overflowModal.date}
        appointments={overflowModal.appointments}
      />
    </div>
  )
}
