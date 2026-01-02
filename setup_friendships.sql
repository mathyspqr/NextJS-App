-- =============================================
-- SETUP SYSTÈME D'AMIS - ChatFlow
-- Exécuter dans Supabase SQL Editor
-- =============================================

-- 1. Créer la table friendships
CREATE TABLE IF NOT EXISTS friendships (
  id SERIAL PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Empêcher les doublons (A->B et B->A comptent comme la même relation)
  UNIQUE (requester_id, addressee_id),
  
  -- Empêcher de s'ajouter soi-même
  CHECK (requester_id != addressee_id)
);

-- 2. Index pour les requêtes fréquentes
CREATE INDEX IF NOT EXISTS idx_friendships_requester ON friendships(requester_id);
CREATE INDEX IF NOT EXISTS idx_friendships_addressee ON friendships(addressee_id);
CREATE INDEX IF NOT EXISTS idx_friendships_status ON friendships(status);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE friendships ENABLE ROW LEVEL SECURITY;

-- 4. Policies RLS

-- Policy: Lecture - voir ses propres relations d'amitié
CREATE POLICY "Users can view their own friendships"
ON friendships FOR SELECT
USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);

-- Policy: Insertion - envoyer une demande d'ami
CREATE POLICY "Users can send friend requests"
ON friendships FOR INSERT
WITH CHECK (
  auth.uid() = requester_id
);

-- Policy: Mise à jour - accepter/refuser une demande reçue
CREATE POLICY "Users can update received friend requests"
ON friendships FOR UPDATE
USING (
  auth.uid() = addressee_id AND status = 'pending'
);

-- Policy: Suppression - supprimer une amitié (les deux peuvent)
CREATE POLICY "Users can delete their friendships"
ON friendships FOR DELETE
USING (
  auth.uid() = requester_id OR auth.uid() = addressee_id
);

-- 5. Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_friendships_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 6. Trigger pour updated_at
DROP TRIGGER IF EXISTS trigger_friendships_updated_at ON friendships;
CREATE TRIGGER trigger_friendships_updated_at
  BEFORE UPDATE ON friendships
  FOR EACH ROW
  EXECUTE FUNCTION update_friendships_updated_at();

-- =============================================
-- VÉRIFICATION
-- =============================================

-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'friendships';

-- Vérifier les policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'friendships';
