type mealsType = {
  id: string
  name: string
  description: string | null
  dateTime: string
  isOnDiet: boolean
  session_id: string
}[]

export function getBestSequenceOnDiet(meals: mealsType) {
  let currentCount = 0
  let maxCount = 0

  for (const meal of meals) {
    if (meal.isOnDiet) {
      currentCount++
      maxCount = Math.max(maxCount, currentCount)
    } else {
      currentCount = 0
    }
  }

  return maxCount
}
