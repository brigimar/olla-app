from app.utils.logger import logger

def process_webhook(data: dict):
    logger.info(f'Received Mercado Pago webhook: {data}')
    return {'received': True}
