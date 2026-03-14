from fastapi import Request

def get_base_url(request: Request, remove_last_segments: int = 1):

    full_url = str(request.url).rstrip('/')
    
    current_index = len(full_url) - 1
    current_amount_removed = 0
    while current_amount_removed < remove_last_segments:
        if full_url[current_index] == '/':
            current_amount_removed+=1
        current_index-=1

    base = full_url[:current_index+1]
    
    return base


