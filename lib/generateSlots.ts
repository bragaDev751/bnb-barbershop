export function generateSlots(start: string, end: string, duration: number) {
  const slots: string[] = []

  let [hour, minute] = start.split(":").map(Number)
  const [endHour, endMinute] = end.split(":").map(Number)

  while (hour < endHour || (hour === endHour && minute < endMinute)) {
    const formatted =
      `${hour.toString().padStart(2,"0")}:${minute.toString().padStart(2,"0")}`

    slots.push(formatted)

    minute += duration

    if (minute >= 60) {
      hour += Math.floor(minute / 60)
      minute = minute % 60
    }
  }

  return slots
}