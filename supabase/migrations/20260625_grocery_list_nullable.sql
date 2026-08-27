-- meal-plans-generate now saves the plan immediately with grocery_list = null,
-- then fills it in via a second background Claude call. The column must allow null.
alter table public.meal_plans alter column grocery_list drop not null;
alter table public.meal_plans alter column grocery_list drop default;
