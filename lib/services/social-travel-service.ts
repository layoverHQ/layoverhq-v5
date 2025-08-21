import { createClient } from '@supabase/supabase-js'
import { Itinerary, TripSegment } from '../types/itinerary'

export interface TravelPost {
  id: string
  userId: string
  user: {
    id: string
    name: string
    avatar: string
    verified: boolean
  }
  type: 'experience' | 'review' | 'photo' | 'itinerary' | 'tip' | 'achievement'
  title: string
  content: string
  location?: {
    city: string
    country: string
    airport?: string
    coordinates?: { lat: number; lng: number }
  }
  media: Array<{
    type: 'image' | 'video'
    url: string
    caption?: string
    alt?: string
  }>
  tags: string[]
  metadata?: {
    itineraryId?: string
    experienceId?: string
    rating?: number
    duration?: number
    cost?: number
    layoverTime?: number
  }
  privacy: 'public' | 'friends' | 'private'
  engagement: {
    likes: number
    comments: number
    shares: number
    saves: number
  }
  createdAt: string
  updatedAt: string
}

export interface TravelComment {
  id: string
  postId: string
  userId: string
  user: {
    id: string
    name: string
    avatar: string
  }
  content: string
  parentCommentId?: string
  replies?: TravelComment[]
  likes: number
  createdAt: string
}

export interface TravelFollowing {
  followerId: string
  followingId: string
  createdAt: string
  mutualFollow: boolean
}

export interface TravelGroup {
  id: string
  name: string
  description: string
  type: 'public' | 'private' | 'invite_only'
  category: 'destination' | 'travel_style' | 'layover_city' | 'general'
  memberCount: number
  avatar?: string
  rules: string[]
  moderators: string[]
  tags: string[]
  createdAt: string
}

export interface SharedItinerary {
  id: string
  originalItineraryId: string
  shareId: string
  title: string
  description?: string
  totalDuration: number
  totalCost?: number
  cities: string[]
  highlights: string[]
  sharedBy: {
    id: string
    name: string
    avatar: string
  }
  privacy: 'public' | 'link_only' | 'friends'
  allowCloning: boolean
  engagement: {
    views: number
    clones: number
    likes: number
    comments: number
  }
  createdAt: string
  expiresAt?: string
}

export class SocialTravelService {
  private supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Posts Management
  async createPost(userId: string, postData: Omit<TravelPost, 'id' | 'userId' | 'user' | 'engagement' | 'createdAt' | 'updatedAt'>): Promise<TravelPost> {
    const newPost: Partial<TravelPost> = {
      id: crypto.randomUUID(),
      userId,
      ...postData,
      engagement: { likes: 0, comments: 0, shares: 0, saves: 0 },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('travel_posts')
      .insert([newPost])
      .select(`
        *,
        user:users(id, name, avatar_url, verified)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`)
    }

    return this.formatPost(data)
  }

  async getFeed(userId: string, options: {
    type?: 'following' | 'discover' | 'trending'
    limit?: number
    offset?: number
  } = {}): Promise<TravelPost[]> {
    const { type = 'discover', limit = 20, offset = 0 } = options

    let query = this.supabase
      .from('travel_posts')
      .select(`
        *,
        user:users(id, name, avatar_url, verified),
        post_likes(user_id),
        post_comments(count)
      `)
      .eq('privacy', 'public')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (type === 'following') {
      // Get posts from users that the current user follows
      const followingQuery = await this.supabase
        .from('travel_following')
        .select('following_id')
        .eq('follower_id', userId)

      if (followingQuery.data && followingQuery.data.length > 0) {
        const followingIds = followingQuery.data.map(f => f.following_id)
        query = query.in('user_id', followingIds)
      }
    } else if (type === 'trending') {
      // Get trending posts based on engagement
      query = query.order('likes', { ascending: false })
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to fetch feed: ${error.message}`)
    }

    return data?.map(this.formatPost) || []
  }

  async getPost(postId: string): Promise<TravelPost | null> {
    const { data, error } = await this.supabase
      .from('travel_posts')
      .select(`
        *,
        user:users(id, name, avatar_url, verified)
      `)
      .eq('id', postId)
      .single()

    if (error) {
      console.error('Error fetching post:', error)
      return null
    }

    return this.formatPost(data)
  }

  async likePost(userId: string, postId: string): Promise<boolean> {
    // Check if already liked
    const { data: existingLike } = await this.supabase
      .from('post_likes')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (existingLike) {
      // Unlike
      await this.supabase
        .from('post_likes')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      await this.updatePostEngagement(postId, 'likes', -1)
      return false
    } else {
      // Like
      await this.supabase
        .from('post_likes')
        .insert([{ user_id: userId, post_id: postId }])

      await this.updatePostEngagement(postId, 'likes', 1)
      return true
    }
  }

  async sharePost(userId: string, postId: string, platforms: string[]): Promise<boolean> {
    try {
      // Log the share
      await this.supabase
        .from('post_shares')
        .insert([{
          user_id: userId,
          post_id: postId,
          platforms,
          shared_at: new Date().toISOString()
        }])

      await this.updatePostEngagement(postId, 'shares', 1)

      return true
    } catch (error) {
      console.error('Error sharing post:', error)
      return false
    }
  }

  async savePost(userId: string, postId: string): Promise<boolean> {
    // Check if already saved
    const { data: existingSave } = await this.supabase
      .from('saved_posts')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .single()

    if (existingSave) {
      // Unsave
      await this.supabase
        .from('saved_posts')
        .delete()
        .eq('user_id', userId)
        .eq('post_id', postId)

      await this.updatePostEngagement(postId, 'saves', -1)
      return false
    } else {
      // Save
      await this.supabase
        .from('saved_posts')
        .insert([{ user_id: userId, post_id: postId }])

      await this.updatePostEngagement(postId, 'saves', 1)
      return true
    }
  }

  // Comments Management
  async addComment(userId: string, postId: string, content: string, parentCommentId?: string): Promise<TravelComment> {
    const newComment = {
      id: crypto.randomUUID(),
      post_id: postId,
      user_id: userId,
      content,
      parent_comment_id: parentCommentId,
      likes: 0,
      created_at: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('post_comments')
      .insert([newComment])
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to add comment: ${error.message}`)
    }

    await this.updatePostEngagement(postId, 'comments', 1)

    return this.formatComment(data)
  }

  async getComments(postId: string): Promise<TravelComment[]> {
    const { data, error } = await this.supabase
      .from('post_comments')
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .eq('post_id', postId)
      .is('parent_comment_id', null)
      .order('created_at', { ascending: true })

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`)
    }

    const comments = data?.map(this.formatComment) || []

    // Get replies for each comment
    for (const comment of comments) {
      comment.replies = await this.getCommentReplies(comment.id)
    }

    return comments
  }

  private async getCommentReplies(commentId: string): Promise<TravelComment[]> {
    const { data, error } = await this.supabase
      .from('post_comments')
      .select(`
        *,
        user:users(id, name, avatar_url)
      `)
      .eq('parent_comment_id', commentId)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching replies:', error)
      return []
    }

    return data?.map(this.formatComment) || []
  }

  // Following System
  async followUser(followerId: string, followingId: string): Promise<boolean> {
    if (followerId === followingId) {
      throw new Error('Cannot follow yourself')
    }

    // Check if already following
    const { data: existingFollow } = await this.supabase
      .from('travel_following')
      .select('id')
      .eq('follower_id', followerId)
      .eq('following_id', followingId)
      .single()

    if (existingFollow) {
      // Unfollow
      await this.supabase
        .from('travel_following')
        .delete()
        .eq('follower_id', followerId)
        .eq('following_id', followingId)

      return false
    } else {
      // Follow
      await this.supabase
        .from('travel_following')
        .insert([{
          follower_id: followerId,
          following_id: followingId,
          created_at: new Date().toISOString()
        }])

      return true
    }
  }

  async getFollowers(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('travel_following')
      .select(`
        follower_id,
        created_at,
        follower:users!follower_id(id, name, avatar_url, verified)
      `)
      .eq('following_id', userId)

    if (error) {
      throw new Error(`Failed to fetch followers: ${error.message}`)
    }

    return data || []
  }

  async getFollowing(userId: string): Promise<any[]> {
    const { data, error } = await this.supabase
      .from('travel_following')
      .select(`
        following_id,
        created_at,
        following:users!following_id(id, name, avatar_url, verified)
      `)
      .eq('follower_id', userId)

    if (error) {
      throw new Error(`Failed to fetch following: ${error.message}`)
    }

    return data || []
  }

  // Itinerary Sharing
  async shareItinerary(userId: string, itineraryId: string, options: {
    privacy: 'public' | 'link_only' | 'friends'
    allowCloning: boolean
    expiresInDays?: number
  }): Promise<SharedItinerary> {
    const itinerary = await this.getItineraryForSharing(itineraryId)
    if (!itinerary) {
      throw new Error('Itinerary not found')
    }

    const shareId = crypto.randomUUID().slice(0, 8)
    const expiresAt = options.expiresInDays 
      ? new Date(Date.now() + options.expiresInDays * 24 * 60 * 60 * 1000).toISOString()
      : undefined

    const sharedItinerary: Partial<SharedItinerary> = {
      id: crypto.randomUUID(),
      originalItineraryId: itineraryId,
      shareId: shareId,
      title: itinerary.title,
      description: itinerary.description,
      totalDuration: itinerary.totalDuration,
      totalCost: itinerary.budget?.total,
      cities: itinerary.segments.map(s => s.location.city).filter((city, index, arr) => arr.indexOf(city) === index),
      highlights: this.extractHighlights(itinerary),
      sharedBy: {
        id: userId,
        name: '',
        avatar: ''
      },
      privacy: options.privacy,
      allowCloning: options.allowCloning,
      engagement: { views: 0, clones: 0, likes: 0, comments: 0 },
      createdAt: new Date().toISOString(),
      expiresAt: expiresAt
    }

    const { data, error } = await this.supabase
      .from('shared_itineraries')
      .insert([sharedItinerary])
      .select(`
        *,
        shared_by:users(id, name, avatar_url)
      `)
      .single()

    if (error) {
      throw new Error(`Failed to share itinerary: ${error.message}`)
    }

    return this.formatSharedItinerary(data)
  }

  async getSharedItinerary(shareId: string, viewerId?: string): Promise<SharedItinerary | null> {
    const { data, error } = await this.supabase
      .from('shared_itineraries')
      .select(`
        *,
        shared_by:users(id, name, avatar_url)
      `)
      .eq('share_id', shareId)
      .single()

    if (error) {
      console.error('Error fetching shared itinerary:', error)
      return null
    }

    // Increment view count
    if (viewerId && viewerId !== data.shared_by) {
      await this.supabase
        .from('shared_itineraries')
        .update({
          engagement: {
            ...data.engagement,
            views: (data.engagement?.views || 0) + 1
          }
        })
        .eq('id', data.id)
    }

    return this.formatSharedItinerary(data)
  }

  async cloneSharedItinerary(userId: string, shareId: string): Promise<string> {
    const sharedItinerary = await this.getSharedItinerary(shareId, userId)
    if (!sharedItinerary || !sharedItinerary.allowCloning) {
      throw new Error('Itinerary cannot be cloned')
    }

    // Get original itinerary data
    const originalItinerary = await this.getItineraryForSharing(sharedItinerary.originalItineraryId)
    if (!originalItinerary) {
      throw new Error('Original itinerary not found')
    }

    // Create new itinerary for the user
    const clonedItinerary = {
      ...originalItinerary,
      id: crypto.randomUUID(),
      userId,
      title: `${originalItinerary.title} (Copy)`,
      status: 'draft',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      segments: originalItinerary.segments.map(segment => ({
        ...segment,
        id: crypto.randomUUID(),
        status: 'upcoming'
      })),
      alerts: [],
      documents: []
    }

    // Save cloned itinerary
    const { data, error } = await this.supabase
      .from('itineraries')
      .insert([clonedItinerary])
      .select('id')
      .single()

    if (error) {
      throw new Error(`Failed to clone itinerary: ${error.message}`)
    }

    // Update clone count
    await this.supabase
      .from('shared_itineraries')
      .update({
        engagement: {
          ...sharedItinerary.engagement,
          clones: (sharedItinerary.engagement?.clones || 0) + 1
        }
      })
      .eq('share_id', shareId)

    return data.id
  }

  // Travel Groups
  async createGroup(userId: string, groupData: Omit<TravelGroup, 'id' | 'memberCount' | 'createdAt'>): Promise<TravelGroup> {
    const newGroup: Partial<TravelGroup> = {
      id: crypto.randomUUID(),
      ...groupData,
      memberCount: 1,
      createdAt: new Date().toISOString()
    }

    const { data, error } = await this.supabase
      .from('travel_groups')
      .insert([newGroup])
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create group: ${error.message}`)
    }

    // Add creator as member and moderator
    await this.supabase
      .from('group_members')
      .insert([{
        group_id: data.id,
        user_id: userId,
        role: 'moderator',
        joined_at: new Date().toISOString()
      }])

    return this.formatGroup(data)
  }

  async joinGroup(userId: string, groupId: string): Promise<boolean> {
    try {
      await this.supabase
        .from('group_members')
        .insert([{
          group_id: groupId,
          user_id: userId,
          role: 'member',
          joined_at: new Date().toISOString()
        }])

      // Update member count
      await this.supabase.rpc('increment_group_members', { group_id: groupId })

      return true
    } catch (error) {
      console.error('Error joining group:', error)
      return false
    }
  }

  // Helper methods
  private formatPost(data: any): TravelPost {
    return {
      id: data.id,
      userId: data.user_id,
      user: {
        id: data.user.id,
        name: data.user.name,
        avatar: data.user.avatar_url,
        verified: data.user.verified || false
      },
      type: data.type,
      title: data.title,
      content: data.content,
      location: data.location,
      media: data.media || [],
      tags: data.tags || [],
      metadata: data.metadata,
      privacy: data.privacy,
      engagement: data.engagement || { likes: 0, comments: 0, shares: 0, saves: 0 },
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  private formatComment(data: any): TravelComment {
    return {
      id: data.id,
      postId: data.post_id,
      userId: data.user_id,
      user: {
        id: data.user.id,
        name: data.user.name,
        avatar: data.user.avatar_url
      },
      content: data.content,
      parentCommentId: data.parent_comment_id,
      likes: data.likes,
      createdAt: data.created_at
    }
  }

  private formatSharedItinerary(data: any): SharedItinerary {
    return {
      id: data.id,
      originalItineraryId: data.original_itinerary_id,
      shareId: data.share_id,
      title: data.title,
      description: data.description,
      totalDuration: data.total_duration,
      totalCost: data.total_cost,
      cities: data.cities,
      highlights: data.highlights,
      sharedBy: {
        id: data.shared_by.id,
        name: data.shared_by.name,
        avatar: data.shared_by.avatar_url
      },
      privacy: data.privacy,
      allowCloning: data.allow_cloning,
      engagement: data.engagement,
      createdAt: data.created_at,
      expiresAt: data.expires_at
    }
  }

  private formatGroup(data: any): TravelGroup {
    return {
      id: data.id,
      name: data.name,
      description: data.description,
      type: data.type,
      category: data.category,
      memberCount: data.member_count,
      avatar: data.avatar,
      rules: data.rules || [],
      moderators: data.moderators || [],
      tags: data.tags || [],
      createdAt: data.created_at
    }
  }

  private async getItineraryForSharing(itineraryId: string): Promise<Itinerary | null> {
    // This would integrate with the ItineraryManager
    // For now, return mock data
    return null
  }

  private extractHighlights(itinerary: Itinerary): string[] {
    const highlights: string[] = []
    
    // Extract unique cities
    const cities = itinerary.segments
      .map(s => s.location.city)
      .filter((city, index, arr) => arr.indexOf(city) === index)
    
    highlights.push(`${cities.length} cities`)
    
    // Extract layover opportunities
    const layovers = itinerary.segments.filter(s => s.type === 'layover')
    if (layovers.length > 0) {
      highlights.push(`${layovers.length} layover experience${layovers.length > 1 ? 's' : ''}`)
    }
    
    // Extract budget savings if available
    if (itinerary.budget?.total) {
      highlights.push(`$${itinerary.budget.total} budget`)
    }
    
    return highlights.slice(0, 3) // Limit to top 3 highlights
  }

  private async updatePostEngagement(postId: string, field: keyof TravelPost['engagement'], delta: number): Promise<void> {
    await this.supabase.rpc('update_post_engagement', {
      post_id: postId,
      field_name: field,
      delta_value: delta
    })
  }

  // Discovery and Search
  async discoverUsers(userId: string, interests: string[] = []): Promise<any[]> {
    let query = this.supabase
      .from('users')
      .select('id, name, avatar_url, verified, travel_stats')
      .neq('id', userId)
      .limit(20)

    if (interests.length > 0) {
      query = query.overlaps('interests', interests)
    }

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to discover users: ${error.message}`)
    }

    return data || []
  }

  async searchContent(query: string, type?: 'posts' | 'users' | 'groups' | 'itineraries'): Promise<any> {
    const results: any = {
      posts: [],
      users: [],
      groups: [],
      itineraries: []
    }

    if (!type || type === 'posts') {
      const { data: posts } = await this.supabase
        .from('travel_posts')
        .select(`
          *,
          user:users(id, name, avatar_url, verified)
        `)
        .or(`title.ilike.%${query}%, content.ilike.%${query}%, tags.cs.{${query}}`)
        .eq('privacy', 'public')
        .limit(10)

      results.posts = posts?.map(this.formatPost) || []
    }

    if (!type || type === 'users') {
      const { data: users } = await this.supabase
        .from('users')
        .select('id, name, avatar_url, verified')
        .ilike('name', `%${query}%`)
        .limit(10)

      results.users = users || []
    }

    return results
  }
}