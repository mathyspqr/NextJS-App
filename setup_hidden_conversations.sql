-- Table pour stocker les conversations masquées par utilisateur
CREATE TABLE IF NOT EXISTS hidden_conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  hidden_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, hidden_user_id)
);

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_hidden_conversations_user_id ON hidden_conversations(user_id);

-- RLS (Row Level Security)
ALTER TABLE hidden_conversations ENABLE ROW LEVEL SECURITY;

-- Politique: les utilisateurs peuvent voir leurs propres entrées
CREATE POLICY "Users can view own hidden conversations"
  ON hidden_conversations FOR SELECT
  USING (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent insérer leurs propres entrées
CREATE POLICY "Users can insert own hidden conversations"
  ON hidden_conversations FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent mettre à jour leurs propres entrées
CREATE POLICY "Users can update own hidden conversations"
  ON hidden_conversations FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Politique: les utilisateurs peuvent supprimer leurs propres entrées
CREATE POLICY "Users can delete own hidden conversations"
  ON hidden_conversations FOR DELETE
  USING (auth.uid() = user_id);
