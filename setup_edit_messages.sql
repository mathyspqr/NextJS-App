-- ================================================
-- Ajouter les colonnes pour l'édition de messages
-- ================================================
-- À exécuter dans le SQL Editor de Supabase

-- 1. Ajouter la colonne updated_at pour tracker les modifications
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE;

-- 2. Ajouter la colonne is_edited pour indiquer si modifié
ALTER TABLE public.messages 
ADD COLUMN IF NOT EXISTS is_edited BOOLEAN DEFAULT FALSE;

-- 3. Créer un trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    IF OLD.message IS DISTINCT FROM NEW.message OR OLD.image_url IS DISTINCT FROM NEW.image_url THEN
        NEW.is_edited = TRUE;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. Attacher le trigger à la table messages
DROP TRIGGER IF EXISTS update_messages_updated_at ON public.messages;
CREATE TRIGGER update_messages_updated_at
    BEFORE UPDATE ON public.messages
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 5. Vérifier que tout est bien configuré
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name IN ('updated_at', 'is_edited');
