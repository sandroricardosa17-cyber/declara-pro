
-- Timestamp trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  email TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ========== USER ROLES ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'funcionario');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT USING (auth.uid() = user_id);

-- ========== CLIENTS ==========
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cpf TEXT NOT NULL,
  birth_date DATE,
  phone TEXT,
  email TEXT,
  address TEXT,
  profession TEXT,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own clients" ON public.clients FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own clients" ON public.clients FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own clients" ON public.clients FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own clients" ON public.clients FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON public.clients
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_clients_user_id ON public.clients(user_id);
CREATE INDEX idx_clients_cpf ON public.clients(cpf);

-- ========== DECLARATIONS ==========
CREATE TYPE public.declaration_status AS ENUM (
  'aguardando_documentos', 'em_andamento', 'em_revisao',
  'finalizada', 'enviada', 'em_processamento', 'processada'
);

CREATE TYPE public.declaration_type AS ENUM ('completa', 'simplificada');
CREATE TYPE public.declaration_result AS ENUM ('a_restituir', 'a_pagar', 'sem_imposto');
CREATE TYPE public.fiscal_risk AS ENUM ('baixo', 'medio', 'alto');

CREATE TABLE public.declarations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  year_base INT NOT NULL,
  exercise_year INT NOT NULL,
  status declaration_status NOT NULL DEFAULT 'aguardando_documentos',
  type declaration_type NOT NULL DEFAULT 'completa',
  result declaration_result,
  result_value NUMERIC(12,2),
  installments INT,
  sent_date DATE,
  processed_date DATE,
  refund_batch TEXT,
  fiscal_risk fiscal_risk NOT NULL DEFAULT 'baixo',
  malha_fina BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(client_id, year_base)
);

ALTER TABLE public.declarations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own declarations" ON public.declarations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own declarations" ON public.declarations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own declarations" ON public.declarations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own declarations" ON public.declarations FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_declarations_updated_at BEFORE UPDATE ON public.declarations
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_declarations_user_id ON public.declarations(user_id);
CREATE INDEX idx_declarations_client_id ON public.declarations(client_id);

-- ========== DOCUMENTS ==========
CREATE TYPE public.document_category AS ENUM (
  'comprovantes_rendimentos', 'despesas_medicas', 'educacao',
  'informes_bancarios', 'notas_fiscais', 'outros'
);

CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  declaration_id UUID NOT NULL REFERENCES public.declarations(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT,
  category document_category NOT NULL DEFAULT 'outros',
  reviewed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own documents" ON public.documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON public.documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON public.documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON public.documents FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX idx_documents_declaration_id ON public.documents(declaration_id);

-- ========== PAYMENTS ==========
CREATE TYPE public.payment_method AS ENUM ('pix', 'cartao', 'dinheiro', 'transferencia');
CREATE TYPE public.payment_status AS ENUM ('pendente', 'pago', 'parcial');

CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  declaration_id UUID NOT NULL REFERENCES public.declarations(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  payment_method payment_method,
  status payment_status NOT NULL DEFAULT 'pendente',
  installments INT DEFAULT 1,
  due_date DATE,
  paid_at TIMESTAMPTZ,
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own payments" ON public.payments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own payments" ON public.payments FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own payments" ON public.payments FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON public.payments
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_payments_declaration_id ON public.payments(declaration_id);

-- ========== TASKS ==========
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  declaration_id UUID NOT NULL REFERENCES public.declarations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  assigned_to UUID REFERENCES auth.users(id),
  due_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON public.tasks
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_tasks_declaration_id ON public.tasks(declaration_id);

-- ========== STORAGE BUCKET FOR DOCUMENTS ==========
INSERT INTO storage.buckets (id, name, public) VALUES ('irpf-documents', 'irpf-documents', false);

CREATE POLICY "Users can view own files" ON storage.objects FOR SELECT
USING (bucket_id = 'irpf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload own files" ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'irpf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete own files" ON storage.objects FOR DELETE
USING (bucket_id = 'irpf-documents' AND auth.uid()::text = (storage.foldername(name))[1]);
