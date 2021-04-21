FROM continuumio/miniconda3

WORKDIR /src

# Create the environment:
ADD environment.yml /tmp/environment.yml
RUN conda env create -f /tmp/environment.yml

# Make RUN commands use the new environment:
# SHELL ["conda", "run", "-n", "human", "/bin/bash", "-c"]

# Make sure the environment is activated:
# RUN echo "Make sure flask is installed:"
# RUN python -c "import flask"

# Copy files
COPY app app
COPY data data
COPY instance instance
COPY uploaded_files uploaded_files
COPY logo.png .
COPY start.py .

# The code to run when container is started:
# -

# Start with Gunicorn
ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "human", "gunicorn", "-b=0.0.0.0:8000", "-w=3", "--worker-tmp-dir=/dev/shm", "--log-level=debug", "start"]
# For normal flask run:
# ENTRYPOINT ["conda", "run", "--no-capture-output", "-n", "human", "flask", "run", "--host=0.0.0.0"]
