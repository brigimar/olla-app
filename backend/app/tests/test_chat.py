import pytest
from app.db.supabase_client import supabase_block_phone_in_text

def test_block_phone_in_text_masks_numbers():
    msg = "Mi número es 11-2345-6789"
    masked = supabase_block_phone_in_text(msg)
    assert "[masked]" in masked
