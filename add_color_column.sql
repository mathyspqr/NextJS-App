-- ================================================
-- Ajouter la colonne color à la table profiles
-- ================================================
-- À exécuter dans le SQL Editor de votre projet Supabase

-- 1. Ajouter la colonne color avec une valeur par défaut
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#3B82F6';

-- 2. Mettre à jour les profils existants qui n'ont pas de couleur
UPDATE public.profiles 
SET color = '#3B82F6' 
WHERE color IS NULL;

-- 3. Vérifier que la colonne a été ajoutée
SELECT id, username, color FROM public.profiles LIMIT 10;

-- ================================================
-- Couleurs suggérées pour les utilisateurs
-- ================================================
-- Bleu: #3B82F6 (par défaut)
-- Vert: #10B981
-- Rouge: #EF4444
-- Violet: #8B5CF6
-- Orange: #F59E0B
-- Rose: #EC4899
-- Indigo: #6366F1
-- Jaune: #EAB308
