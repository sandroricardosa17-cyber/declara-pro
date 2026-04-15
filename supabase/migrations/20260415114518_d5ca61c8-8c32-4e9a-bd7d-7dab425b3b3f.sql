CREATE POLICY "Admins can update all payments"
ON public.payments FOR UPDATE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert all payments"
ON public.payments FOR INSERT
TO authenticated
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all payments"
ON public.payments FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));