FROM nginx:alpine

COPY nginx.conf /etc/nginx/nginx.conf

COPY reload.sh /reload.sh
RUN chmod +x /reload.sh
CMD nginx && /reload.sh