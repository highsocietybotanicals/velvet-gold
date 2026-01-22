-- Add explicit authentication requirement policies for profiles table
-- These ensure only authenticated users can attempt any operations

CREATE POLICY "Require authentication for profiles access" 
ON public.profiles 
FOR ALL 
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);

-- Add explicit authentication requirement policies for orders table
CREATE POLICY "Require authentication for orders access" 
ON public.orders 
FOR ALL 
TO public
USING (auth.uid() IS NOT NULL)
WITH CHECK (auth.uid() IS NOT NULL);