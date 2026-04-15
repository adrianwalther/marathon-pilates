-- Enable RLS on all tables that were missing it.
-- Fixes Supabase security advisory: "Table publicly accessible".
-- Applied 2026-04-15.

-- on_demand_classes
ALTER TABLE on_demand_classes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "on_demand_classes: authenticated can read published"
  ON on_demand_classes FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "on_demand_classes: admin full access"
  ON on_demand_classes FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- broadcasts
ALTER TABLE broadcasts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "broadcasts: admin full access"
  ON broadcasts FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- leads
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "leads: admin full access"
  ON leads FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- lead_tasks
ALTER TABLE lead_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lead_tasks: admin full access"
  ON lead_tasks FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- client_milestones
ALTER TABLE client_milestones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "client_milestones: client read own"
  ON client_milestones FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "client_milestones: admin full access"
  ON client_milestones FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- referrals
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referrals: client read own"
  ON referrals FOR SELECT TO authenticated
  USING (referrer_id = auth.uid() OR referred_client_id = auth.uid());

CREATE POLICY "referrals: admin full access"
  ON referrals FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- testimonials
ALTER TABLE testimonials ENABLE ROW LEVEL SECURITY;

CREATE POLICY "testimonials: read published or own"
  ON testimonials FOR SELECT TO authenticated
  USING (status = 'published' OR client_id = auth.uid());

CREATE POLICY "testimonials: admin full access"
  ON testimonials FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- chat_conversations
ALTER TABLE chat_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_conversations: client read own"
  ON chat_conversations FOR SELECT TO authenticated
  USING (client_id = auth.uid());

CREATE POLICY "chat_conversations: client insert own"
  ON chat_conversations FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "chat_conversations: admin full access"
  ON chat_conversations FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));

-- chat_messages
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "chat_messages: client read own conversations"
  ON chat_messages FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.client_id = auth.uid()
  ));

CREATE POLICY "chat_messages: client insert own conversations"
  ON chat_messages FOR INSERT TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM chat_conversations
    WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.client_id = auth.uid()
  ));

CREATE POLICY "chat_messages: admin full access"
  ON chat_messages FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.role IN ('admin','manager')));
