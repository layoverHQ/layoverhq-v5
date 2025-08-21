"use client"

import { useState } from "react"
import { Star, ThumbsUp, ThumbsDown, Flag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface Review {
  id: string
  userId: string
  userName: string
  userAvatar?: string
  rating: number
  title: string
  content: string
  date: string
  helpful: number
  notHelpful: number
  verified: boolean
  experienceType?: string
}

interface ReviewsRatingsProps {
  itemId: string
  itemType: "experience" | "flight" | "hotel"
  averageRating: number
  totalReviews: number
  reviews: Review[]
  onSubmitReview?: (review: { rating: number; title: string; content: string }) => void
  canReview?: boolean
}

export function ReviewsRatings({
  itemId,
  itemType,
  averageRating,
  totalReviews,
  reviews,
  onSubmitReview,
  canReview = false,
}: ReviewsRatingsProps) {
  const [showReviewForm, setShowReviewForm] = useState(false)
  const [newReview, setNewReview] = useState({
    rating: 0,
    title: "",
    content: "",
  })
  const [hoveredRating, setHoveredRating] = useState(0)

  const handleSubmitReview = () => {
    if (newReview.rating > 0 && newReview.title.trim() && newReview.content.trim()) {
      onSubmitReview?.(newReview)
      setNewReview({ rating: 0, title: "", content: "" })
      setShowReviewForm(false)
    }
  }

  const renderStars = (rating: number, size: "sm" | "md" | "lg" = "md") => {
    const sizeClasses = {
      sm: "h-3 w-3",
      md: "h-4 w-4",
      lg: "h-5 w-5",
    }

    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={cn(
              sizeClasses[size],
              star <= rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300",
            )}
          />
        ))}
      </div>
    )
  }

  const renderInteractiveStars = (currentRating: number, onRate: (rating: number) => void) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onMouseEnter={() => setHoveredRating(star)}
            onMouseLeave={() => setHoveredRating(0)}
            onClick={() => onRate(star)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                "h-6 w-6 transition-colors",
                star <= (hoveredRating || currentRating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-gray-300 hover:text-yellow-200",
              )}
            />
          </button>
        ))}
      </div>
    )
  }

  const getRatingDistribution = () => {
    const distribution = [0, 0, 0, 0, 0]
    reviews.forEach((review) => {
      if (review.rating >= 1 && review.rating <= 5) {
        distribution[review.rating - 1]++
      }
    })
    return distribution.reverse() // 5 stars first
  }

  const ratingDistribution = getRatingDistribution()

  return (
    <div className="space-y-6">
      {/* Overall Rating Summary */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Reviews & Ratings</h3>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Average Rating */}
            <div className="text-center">
              <div className="text-4xl font-bold text-primary mb-2">{averageRating.toFixed(1)}</div>
              {renderStars(averageRating, "lg")}
              <p className="text-sm text-muted-foreground mt-2">
                Based on {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
              </p>
            </div>

            {/* Rating Distribution */}
            <div className="space-y-2">
              {[5, 4, 3, 2, 1].map((stars, index) => {
                const count = ratingDistribution[index]
                const percentage = totalReviews > 0 ? (count / totalReviews) * 100 : 0

                return (
                  <div key={stars} className="flex items-center space-x-2 text-sm">
                    <span className="w-8">{stars}</span>
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <div className="flex-1 bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-yellow-400 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                    <span className="w-8 text-right text-muted-foreground">{count}</span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Write Review Button */}
          {canReview && (
            <div className="mt-6 pt-6 border-t">
              <Button
                onClick={() => setShowReviewForm(!showReviewForm)}
                variant={showReviewForm ? "outline" : "default"}
              >
                {showReviewForm ? "Cancel" : "Write a Review"}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Review Form */}
      {showReviewForm && (
        <Card>
          <CardHeader>
            <h4 className="text-lg font-semibold">Write Your Review</h4>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rating</label>
              {renderInteractiveStars(newReview.rating, (rating) =>
                setNewReview((prev) => ({ ...prev, rating })),
              )}
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Review Title</label>
              <input
                type="text"
                placeholder="Summarize your experience"
                value={newReview.title}
                onChange={(e) => setNewReview((prev) => ({ ...prev, title: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Your Review</label>
              <Textarea
                placeholder="Share your experience with other travelers..."
                value={newReview.content}
                onChange={(e) => setNewReview((prev) => ({ ...prev, content: e.target.value }))}
                rows={4}
              />
            </div>

            <div className="flex space-x-2">
              <Button
                onClick={handleSubmitReview}
                disabled={!newReview.rating || !newReview.title.trim() || !newReview.content.trim()}
              >
                Submit Review
              </Button>
              <Button variant="outline" onClick={() => setShowReviewForm(false)}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.map((review) => (
          <Card key={review.id}>
            <CardContent className="pt-6">
              <div className="flex items-start space-x-4">
                <Avatar>
                  <AvatarImage src={review.userAvatar || "/placeholder.svg"} />
                  <AvatarFallback>
                    <User className="h-4 w-4" />
                  </AvatarFallback>
                </Avatar>

                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{review.userName}</span>
                      {review.verified && (
                        <Badge variant="secondary" className="text-xs">
                          Verified
                        </Badge>
                      )}
                      {review.experienceType && (
                        <Badge variant="outline" className="text-xs">
                          {review.experienceType}
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">{review.date}</span>
                  </div>

                  <div className="flex items-center space-x-2">
                    {renderStars(review.rating)}
                    <span className="text-sm font-medium">{review.title}</span>
                  </div>

                  <p className="text-sm text-gray-700 leading-relaxed">{review.content}</p>

                  <div className="flex items-center space-x-4 pt-2">
                    <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground">
                      <ThumbsUp className="h-3 w-3" />
                      <span>Helpful ({review.helpful})</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground">
                      <ThumbsDown className="h-3 w-3" />
                      <span>Not helpful ({review.notHelpful})</span>
                    </button>
                    <button className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-foreground">
                      <Flag className="h-3 w-3" />
                      <span>Report</span>
                    </button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {reviews.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-muted-foreground">
              No reviews yet. Be the first to share your experience!
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
