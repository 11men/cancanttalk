// Supabase 스키마 타입 정의
// 프로덕션에서는 `npx supabase gen types typescript --project-id <id>` 로 자동 생성 권장

export type QuestionStatus = "pending" | "approved" | "rejected";
export type ReactionKind = "like" | "dislike";

type CategoryRow = {
  id: number;
  slug: string;
  name: string;
  emoji: string;
  order_index: number;
  created_at: string;
};
type CategoryInsert = {
  slug: string;
  name: string;
  emoji: string;
  order_index?: number;
};
type CategoryUpdate = Partial<CategoryInsert>;

type ProfileRow = {
  id: string;
  nickname: string | null;
  title: string | null;
  badge_count: number;
  is_admin: boolean;
  created_at: string;
  updated_at: string;
};
type ProfileInsert = {
  id: string;
  nickname?: string | null;
  title?: string | null;
  badge_count?: number;
  is_admin?: boolean;
};
type ProfileUpdate = Partial<Omit<ProfileInsert, "id">>;

type QuestionRow = {
  id: string;
  category_id: number;
  content: string;
  author_id: string | null;
  difficulty: number;
  status: QuestionStatus;
  vote_count: number;
  yes_count: number;
  created_at: string;
};
type QuestionInsert = {
  category_id: number;
  content: string;
  author_id?: string | null;
  difficulty?: number;
  status?: QuestionStatus;
};
type QuestionUpdate = Partial<QuestionInsert> & { status?: QuestionStatus };

type VoteRow = {
  user_id: string;
  question_id: string;
  choice: boolean;
  created_at: string;
};
type VoteInsert = {
  user_id: string;
  question_id: string;
  choice: boolean;
};
type VoteUpdate = Partial<VoteInsert>;

type CommentRow = {
  id: string;
  question_id: string;
  user_id: string;
  content: string;
  like_count: number;
  dislike_count: number;
  is_best: boolean;
  created_at: string;
};
type CommentInsert = {
  question_id: string;
  user_id: string;
  content: string;
  is_best?: boolean;
};
type CommentUpdate = Partial<CommentInsert> & { is_best?: boolean };

type CommentReactionRow = {
  comment_id: string;
  user_id: string;
  reaction: ReactionKind;
  created_at: string;
};
type CommentReactionInsert = {
  comment_id: string;
  user_id: string;
  reaction: ReactionKind;
};
type CommentReactionUpdate = Partial<CommentReactionInsert>;

export type ModerationKind = "comment" | "question";

type ModerationBlockRow = {
  id: string;
  user_id: string | null;
  kind: ModerationKind;
  content: string;
  reason: string;
  matched: string | null;
  created_at: string;
};
type ModerationBlockInsert = {
  user_id?: string | null;
  kind: ModerationKind;
  content: string;
  reason: string;
  matched?: string | null;
};
type ModerationBlockUpdate = Partial<ModerationBlockInsert>;

export type Database = {
  public: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
        Relationships: [];
      };
      profiles: {
        Row: ProfileRow;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
        Relationships: [];
      };
      questions: {
        Row: QuestionRow;
        Insert: QuestionInsert;
        Update: QuestionUpdate;
        Relationships: [];
      };
      votes: {
        Row: VoteRow;
        Insert: VoteInsert;
        Update: VoteUpdate;
        Relationships: [];
      };
      comments: {
        Row: CommentRow;
        Insert: CommentInsert;
        Update: CommentUpdate;
        Relationships: [];
      };
      comment_reactions: {
        Row: CommentReactionRow;
        Insert: CommentReactionInsert;
        Update: CommentReactionUpdate;
        Relationships: [];
      };
      moderation_blocks: {
        Row: ModerationBlockRow;
        Insert: ModerationBlockInsert;
        Update: ModerationBlockUpdate;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      question_status: QuestionStatus;
      reaction_kind: ReactionKind;
    };
    CompositeTypes: Record<string, never>;
  };
};

export type Category = CategoryRow;
export type Question = QuestionRow;
export type Vote = VoteRow;
export type Comment = CommentRow;
export type Profile = ProfileRow;
